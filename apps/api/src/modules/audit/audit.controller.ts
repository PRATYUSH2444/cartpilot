import { Request, Response } from 'express';
import { auditService, GENESIS_HASH } from './audit.service.js';
import { AuditEventModel } from './audit-event.model.js';

export class AuditController {
  async getEvents(req: Request, res: Response): Promise<void> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const eventType = req.query.eventType as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const result = await auditService.listEvents({ page, limit, eventType, resourceType });

    res.status(200).json({
      success: true,
      data: result.events,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  }

  async verifyChain(_req: Request, res: Response): Promise<void> {
    const verification = await auditService.verifyChain();

    res.status(200).json({
      success: verification.valid,
      data: verification,
    });
  }

  /**
   * Real-time Server-Sent Events (SSE) streaming audit log for Master Admin console.
   */
  async streamEvents(req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const lastEvent = await AuditEventModel.findOne().sort({ sequenceNumber: -1 }).lean();
    const initialPayload = JSON.stringify({
      type: 'INIT',
      ledgerHeight: lastEvent ? lastEvent.sequenceNumber : 0,
      latestHash: lastEvent ? lastEvent.currentHash : GENESIS_HASH,
      timestamp: new Date().toISOString(),
    });

    res.write(`event: initial_state\ndata: ${initialPayload}\n\n`);

    const onEvent = (event: Record<string, unknown>) => {
      res.write(`event: audit_event\ndata: ${JSON.stringify(event)}\n\n`);
    };

    auditService.streamEmitter.on('audit_event', onEvent);

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      auditService.streamEmitter.off('audit_event', onEvent);
      res.end();
    });
  }

  /**
   * Stream the entire cryptographic hash ledger line-by-line as NDJSON.
   */
  async exportLedger(_req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', 'attachment; filename="cartpilot-audit-ledger.ndjson"');

    for await (const chunk of auditService.exportLedgerStream()) {
      res.write(chunk);
    }
    res.end();
  }
}

export const auditController = new AuditController();
