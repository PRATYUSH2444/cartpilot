import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwilioSmsService } from './twilio-sms.service.js';

describe('TwilioSmsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeE164', () => {
    it('normalizes 10-digit Indian numbers to E.164 (+91XXXXXXXXXX)', () => {
      expect(TwilioSmsService.normalizeE164('9876543210')).toBe('+919876543210');
      expect(TwilioSmsService.normalizeE164(' 9876543210 ')).toBe('+919876543210');
      expect(TwilioSmsService.normalizeE164('98765-43210')).toBe('+919876543210');
    });

    it('preserves valid +91 numbers', () => {
      expect(TwilioSmsService.normalizeE164('+919876543210')).toBe('+919876543210');
      expect(TwilioSmsService.normalizeE164('+91 98765 43210')).toBe('+919876543210');
    });

    it('rejects invalid numbers', () => {
      expect(() => TwilioSmsService.normalizeE164('123')).toThrow();
      expect(() => TwilioSmsService.normalizeE164('abc')).toThrow();
    });
  });

  describe('maskPhone', () => {
    it('masks phone numbers for secure logging without exposing full identity', () => {
      const masked = TwilioSmsService.maskPhone('+919876543210');
      expect(masked).toBe('+91******3210');
      expect(masked).not.toContain('987654');
    });
  });

  describe('sendSms & rate limiting', () => {
    it('dispatches clean simulated SMS in dev/test when Twilio is unconfigured', async () => {
      const res = await TwilioSmsService.sendSms({
        to: '+919999900001',
        body: 'Your CartPilot code is: 1234. Valid for 5 minutes.',
      });

      expect(res.success).toBe(true);
      expect(res.carrier).toBe('SIMULATED');
      expect(res.sid).toBeDefined();
    });

    it('rejects rapid consecutive requests within 60s cooldown (anti-pumping)', async () => {
      const phone = '+919999900002';
      await TwilioSmsService.sendSms({ to: phone, body: 'Code: 1111' });

      await expect(
        TwilioSmsService.sendSms({ to: phone, body: 'Code: 2222' })
      ).rejects.toThrow(/Please wait/);
    });
  });

  describe('handleClerkSmsWebhook', () => {
    it('processes Clerk sms.created payload idempotently', async () => {
      const mockPayload = JSON.stringify({
        type: 'sms.created',
        data: {
          id: 'msg_test_clerk_123',
          to_phone_number: '+919999900003',
          message: 'CartPilot code: 9988',
        },
      });

      const res1 = await TwilioSmsService.handleClerkSmsWebhook(mockPayload, {});
      expect(res1.received).toBe(true);
      expect(res1.dispatched).toBe(true);

      // Second identical event should be recognized as duplicate (idempotent)
      const res2 = await TwilioSmsService.handleClerkSmsWebhook(mockPayload, {});
      expect(res2.received).toBe(true);
      expect(res2.dispatched).toBe(false);
    });
  });
});
