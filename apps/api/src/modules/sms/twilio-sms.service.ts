import crypto from 'crypto';
import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';
import { auditService } from '../audit/audit.service.js';
import { BadRequestError } from '../../common/errors/app-error.js';

export interface SendSmsParams {
  to: string;
  body: string;
  messageId?: string;
}

export interface SendSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
  carrier?: string;
}

export class TwilioSmsService {
  // Anti-pumping in-memory cache: phone -> Array of timestamps in ms
  private static dispatchHistory = new Map<string, number[]>();
  // Processed webhook idempotency cache: eventId -> timestamp
  private static processedEvents = new Map<string, number>();

  /**
   * Normalizes an Indian (+91) or international mobile number to standard E.164.
   */
  public static normalizeE164(phone: string): string {
    const clean = phone.trim().replace(/[\s\-\(\)]/g, '');
    if (/^\d{10}$/.test(clean)) {
      return `+91${clean}`;
    }
    if (/^\+91\d{10}$/.test(clean)) {
      return clean;
    }
    if (/^\+?[1-9]\d{7,14}$/.test(clean)) {
      return clean.startsWith('+') ? clean : `+${clean}`;
    }
    throw new BadRequestError('Invalid mobile number format. Please provide a valid 10-digit Indian number (+91)');
  }

  /**
   * Masks a mobile number for secure, privacy-compliant audit logs.
   * Example: +919876543210 -> +91******3210
   */
  public static maskPhone(phone: string): string {
    if (!phone || phone.length < 8) return '****';
    const clean = phone.trim();
    const prefix = clean.slice(0, 3);
    const suffix = clean.slice(-4);
    return `${prefix}******${suffix}`;
  }

  /**
   * Validates rate limits to prevent OTP pumping and SMS toll fraud.
   * Max 1 request per 60 seconds; max 5 requests per hour per phone.
   */
  private static checkRateLimit(phone: string): void {
    const now = Date.now();
    const history = this.dispatchHistory.get(phone) || [];

    // Filter to last 1 hour
    const lastHour = history.filter((t) => now - t < 3600000);

    if (lastHour.length > 0) {
      const mostRecent = lastHour[lastHour.length - 1];
      if (mostRecent !== undefined && now - mostRecent < 60000) {
        const waitSec = Math.ceil((60000 - (now - mostRecent)) / 1000);
        throw new BadRequestError(`Please wait ${waitSec} second(s) before requesting a new SMS OTP`);
      }
    }

    if (lastHour.length >= 5) {
      throw new BadRequestError('Too many SMS verification requests for this number. Please try again after 1 hour.');
    }

    lastHour.push(now);
    this.dispatchHistory.set(phone, lastHour);
  }

  /**
   * Delivers an SMS message to the carrier via Twilio Programmable Messaging.
   */
  public static async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    const normalizedPhone = this.normalizeE164(params.to);
    const masked = this.maskPhone(normalizedPhone);

    this.checkRateLimit(normalizedPhone);

    const hasTwilioCredentials = Boolean(
      env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID)
    );

    if (!hasTwilioCredentials) {
      logger.info(
        { phone: masked, messageLength: params.body.length },
        '📱 [DEV/TEST] Twilio credentials not fully configured; SMS dispatch simulated cleanly.'
      );
      return {
        success: true,
        sid: `sim_${crypto.randomBytes(8).toString('hex')}`,
        carrier: 'SIMULATED',
      };
    }

    try {
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;

      const bodyParams = new URLSearchParams();
      bodyParams.append('To', normalizedPhone);
      bodyParams.append('Body', params.body);

      if (env.TWILIO_MESSAGING_SERVICE_SID) {
        bodyParams.append('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
      } else if (env.TWILIO_PHONE_NUMBER) {
        bodyParams.append('From', env.TWILIO_PHONE_NUMBER);
      }

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const responseText = await res.text();

      if (res.ok) {
        let sid: string | undefined;
        try {
          const json = JSON.parse(responseText);
          sid = json.sid;
        } catch {}

        logger.info(
          { phone: masked, sid },
          '✅ Real SMS OTP dispatched to carrier via Twilio Programmable Messaging'
        );

        await auditService.recordEvent({
          eventType: 'SMS_DISPATCHED',
          actorId: 'TWILIO_SMS_SERVICE',
          actorRole: 'SYSTEM',
          resourceId: normalizedPhone,
          resourceType: 'USER',
          payload: {
            maskedPhone: masked,
            sid,
            carrier: 'TWILIO',
          },
        });

        return { success: true, sid, carrier: 'TWILIO' };
      } else {
        logger.error(
          { phone: masked, error: responseText },
          '❌ Twilio carrier rejected SMS dispatch request'
        );

        await auditService.recordEvent({
          eventType: 'SMS_DELIVERY_FAILED',
          actorId: 'TWILIO_SMS_SERVICE',
          actorRole: 'SYSTEM',
          resourceId: normalizedPhone,
          resourceType: 'USER',
          payload: {
            maskedPhone: masked,
            error: responseText,
          },
        });

        return { success: false, error: responseText };
      }
    } catch (err: any) {
      logger.error(
        { phone: masked, err: err?.message || err },
        '❌ Network error communicating with Twilio API'
      );
      return { success: false, error: err?.message || 'Network error communicating with Twilio' };
    }
  }

  /**
   * Handles Clerk custom SMS delivery webhook (`sms.created`).
   * Clerk generates and verifies the OTP code; this webhook delivers it through Twilio.
   */
  public static async handleClerkSmsWebhook(
    payload: string,
    headers: Record<string, string>
  ): Promise<{ received: boolean; dispatched: boolean }> {
    const webhookSecret = env.CLERK_SMS_WEBHOOK_SECRET || env.CLERK_WEBHOOK_SECRET;

    let event: any;
    if (webhookSecret) {
      const { Webhook } = await import('svix');
      const wh = new Webhook(webhookSecret);
      event = wh.verify(payload, headers);
    } else {
      event = JSON.parse(payload);
    }

    if (event.type !== 'sms.created') {
      logger.warn({ type: event.type }, 'Ignoring non-SMS Clerk webhook event');
      return { received: true, dispatched: false };
    }

    const data = event.data;
    const eventId = event.data?.id || (event as any).id;

    // Idempotency check: don't dispatch duplicate SMS if Clerk retries webhook
    if (eventId && this.processedEvents.has(eventId)) {
      logger.info({ eventId }, 'Duplicate Clerk sms.created webhook received; skipping dispatch.');
      return { received: true, dispatched: false };
    }

    if (eventId) {
      this.processedEvents.set(eventId, Date.now());
      // Clean up old processed events after 1 hour
      if (this.processedEvents.size > 1000) {
        const oneHourAgo = Date.now() - 3600000;
        for (const [id, time] of this.processedEvents.entries()) {
          if (time < oneHourAgo) this.processedEvents.delete(id);
        }
      }
    }

    const toPhone = data.to_phone_number;
    const message = data.message;

    if (!toPhone || !message) {
      logger.error({ data }, 'Clerk sms.created payload missing to_phone_number or message');
      throw new BadRequestError('Invalid Clerk SMS payload: missing to_phone_number or message');
    }

    const result = await this.sendSms({
      to: toPhone,
      body: message,
      messageId: eventId,
    });

    return { received: true, dispatched: result.success };
  }
}
