import crypto from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '../../common/logging/logger.js';
import {
  AuditActorRole,
  AuditEventDocument,
  AuditEventModel,
  AuditEventType,
  AuditResourceType,
  IAuditEvent,
} from './audit-event.model.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function canonicalJsonStringify(obj: unknown, visited = new WeakSet()): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }
  if (visited.has(obj)) {
    return '"{CIRCULAR}"';
  }
  visited.add(obj);

  // If object has toObject or toJSON, extract plain representation
  let plain: unknown = obj;
  if (typeof (obj as { toObject?: () => unknown }).toObject === 'function') {
    plain = (obj as { toObject: () => unknown }).toObject();
  } else if (typeof (obj as { toJSON?: () => unknown }).toJSON === 'function') {
    plain = (obj as { toJSON: () => unknown }).toJSON();
  }

  if (plain === null || typeof plain !== 'object') {
    return JSON.stringify(plain);
  }

  if (Array.isArray(plain)) {
    return `[${plain.map((item) => canonicalJsonStringify(item, visited)).join(',')}]`;
  }

  const keys = Object.keys(plain as Record<string, unknown>).sort();
  const entries = keys
    .filter(
      (key) =>
        !key.startsWith('$') &&
        key !== '_doc' &&
        (plain as Record<string, unknown>)[key] !== undefined
    )
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalJsonStringify((plain as Record<string, unknown>)[key], visited)}`
    );
  return `{${entries.join(',')}}`;
}

export function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function computePayloadHash(payload: Record<string, unknown>): string {
  return computeSha256(canonicalJsonStringify(payload));
}

export function computeEventCurrentHash(params: {
  sequenceNumber: number;
  timestamp: Date;
  eventType: string;
  actorId: string;
  payloadHash: string;
  previousHash: string;
}): string {
  const content = `${params.sequenceNumber}:${params.timestamp.toISOString()}:${params.eventType}:${params.actorId}:${params.payloadHash}:${params.previousHash}`;
  return computeSha256(content);
}

export class AuditService {
  public readonly streamEmitter: EventEmitter = new EventEmitter();

  constructor() {
    this.streamEmitter.setMaxListeners(50);
  }

  /**
   * Append an immutable, cryptographically chained audit event to the ledger.
   */
  async recordEvent(params: {
    eventType: AuditEventType;
    actorId: string;
    actorRole: AuditActorRole;
    resourceId: string;
    resourceType: AuditResourceType;
    payload?: Record<string, unknown>;
    timestamp?: Date;
  }): Promise<AuditEventDocument> {
    const timestamp = params.timestamp || new Date();
    const payload = params.payload || {};
    const payloadHash = computePayloadHash(payload);

    // Concurrency retry loop for sequence counter
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const lastEvent = await AuditEventModel.findOne().sort({ sequenceNumber: -1 }).lean();
        const sequenceNumber = lastEvent ? lastEvent.sequenceNumber + 1 : 1;
        const previousHash = lastEvent ? lastEvent.currentHash : GENESIS_HASH;

        const currentHash = computeEventCurrentHash({
          sequenceNumber,
          timestamp,
          eventType: params.eventType,
          actorId: params.actorId,
          payloadHash,
          previousHash,
        });

        const event = await AuditEventModel.create({
          sequenceNumber,
          timestamp,
          eventType: params.eventType,
          actorId: params.actorId,
          actorRole: params.actorRole,
          resourceId: params.resourceId,
          resourceType: params.resourceType,
          payload,
          payloadHash,
          previousHash,
          currentHash,
        });

        logger.info(
          {
            sequenceNumber,
            eventType: params.eventType,
            resourceId: params.resourceId,
            currentHash: currentHash.substring(0, 16) + '...',
          },
          'Audit event recorded in hash-chained ledger'
        );

        this.streamEmitter.emit('audit_event', event.toObject());

        return event;
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: number }).code === 11000
        ) {
          // Duplicate sequence number due to concurrent insert; retry next sequence
          continue;
        }
        logger.error({ err, params }, 'Failed to record audit event');
        throw err;
      }
    }

    throw new Error('Could not record audit event after multiple sequence attempts');
  }

  /**
   * Cryptographically verifies the entire audit ledger from Genesis (Seq 1) to the latest event.
   * Returns verification result and identifies the exact block compromised if tampering occurred.
   */
  async verifyChain(): Promise<{
    valid: boolean;
    totalEvents: number;
    compromisedAtSequence?: number;
    message: string;
    latestHash?: string;
  }> {
    const events = await AuditEventModel.find().sort({ sequenceNumber: 1 }).lean();

    if (events.length === 0) {
      return {
        valid: true,
        totalEvents: 0,
        message: 'Audit ledger is empty (valid genesis state)',
        latestHash: GENESIS_HASH,
      };
    }

    let expectedPreviousHash = GENESIS_HASH;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event) continue;

      // Check 1: Sequence number continuity
      if (event.sequenceNumber !== i + 1) {
        return {
          valid: false,
          totalEvents: events.length,
          compromisedAtSequence: event.sequenceNumber,
          message: `Sequence discontinuity detected at position ${i + 1}, found sequence ${event.sequenceNumber}`,
        };
      }

      // Check 2: Link to previous hash
      if (event.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          totalEvents: events.length,
          compromisedAtSequence: event.sequenceNumber,
          message: `Previous hash mismatch at sequence ${event.sequenceNumber}. Expected ${expectedPreviousHash}, found ${event.previousHash}`,
        };
      }

      // Check 3: Payload hash integrity
      const recalculatedPayloadHash = computePayloadHash(event.payload as Record<string, unknown>);
      if (event.payloadHash !== recalculatedPayloadHash) {
        return {
          valid: false,
          totalEvents: events.length,
          compromisedAtSequence: event.sequenceNumber,
          message: `Payload tampering detected at sequence ${event.sequenceNumber}. Stored hash ${event.payloadHash} does not match recalculated ${recalculatedPayloadHash}`,
        };
      }

      // Check 4: Current event hash integrity
      const recalculatedCurrentHash = computeEventCurrentHash({
        sequenceNumber: event.sequenceNumber,
        timestamp: new Date(event.timestamp),
        eventType: event.eventType,
        actorId: event.actorId,
        payloadHash: event.payloadHash,
        previousHash: event.previousHash,
      });

      if (event.currentHash !== recalculatedCurrentHash) {
        return {
          valid: false,
          totalEvents: events.length,
          compromisedAtSequence: event.sequenceNumber,
          message: `Block digest tampering detected at sequence ${event.sequenceNumber}. Stored currentHash ${event.currentHash} does not match recalculated ${recalculatedCurrentHash}`,
        };
      }

      expectedPreviousHash = event.currentHash;
    }

    return {
      valid: true,
      totalEvents: events.length,
      latestHash: expectedPreviousHash,
      message: `Cryptographic verification succeeded. All ${events.length} audit blocks verified against SHA-256 chain.`,
    };
  }

  /**
   * List paginated audit events.
   */
  async listEvents(options: {
    page?: number;
    limit?: number;
    eventType?: string;
    resourceType?: string;
  }): Promise<{ events: IAuditEvent[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (options.eventType) query.eventType = options.eventType;
    if (options.resourceType) query.resourceType = options.resourceType;

    const [events, total] = await Promise.all([
      AuditEventModel.find(query)
        .sort({ sequenceNumber: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IAuditEvent[]>(),
      AuditEventModel.countDocuments(query),
    ]);

    return { events, total, page, limit };
  }

  /**
   * Stream the entire ledger line-by-line as NDJSON for streaming audit export.
   */
  async *exportLedgerStream(): AsyncGenerator<string, void, unknown> {
    const cursor = AuditEventModel.find().sort({ sequenceNumber: 1 }).cursor();
    for await (const doc of cursor) {
      yield JSON.stringify(doc.toObject()) + '\n';
    }
  }
}

export const auditService = new AuditService();
