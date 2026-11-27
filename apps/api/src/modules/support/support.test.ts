import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supportService } from './support.service.js';
import { httpsEmailService } from './https-email.service.js';
import { SupportTicketModel } from './support-ticket.model.js';
import { env } from '../../config/env.config.js';

describe('SupportService & HttpsEmailService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeTopic', () => {
    it('normalizes emoji-prefixed topics to canonical enum strings', () => {
      expect(supportService.normalizeTopic('📦 Order & Delivery')).toBe('Order & Delivery');
      expect(supportService.normalizeTopic('💳 Payment & Wallet')).toBe('Payment & Wallet');
      expect(supportService.normalizeTopic('🥬 Item Quality')).toBe('Item Quality');
      expect(supportService.normalizeTopic('❓ General Question')).toBe('General Question');
    });

    it('accepts canonical topics without emojis', () => {
      expect(supportService.normalizeTopic('Order & Delivery')).toBe('Order & Delivery');
      expect(supportService.normalizeTopic('General Question')).toBe('General Question');
    });

    it('rejects unknown or malicious topics', () => {
      expect(() => supportService.normalizeTopic('HackSystem')).toThrow(/Invalid topic/);
      expect(() => supportService.normalizeTopic('')).toThrow(/Topic is required/);
    });
  });

  describe('sanitizeMessage', () => {
    it('escapes HTML tags to prevent XSS and script injection', () => {
      const sanitized = supportService.sanitizeMessage('<script>alert("hack")</script>');
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;');
    });

    it('trims leading and trailing whitespace', () => {
      expect(supportService.sanitizeMessage('   Where is my delivery?   ')).toBe('Where is my delivery?');
    });
  });

  describe('createTicket (Save first + Resilient Fallback)', () => {
    it('saves ticket in MongoDB first before attempting email dispatch', async () => {
      const mockTicket = {
        _id: 'mock_id_123',
        ticketId: 'TICK-TEST-1234',
        name: 'Pratyush',
        email: 'prakash.pratyushx24@gmail.com',
        topic: 'Order & Delivery',
        message: 'Where is my order?',
        status: 'OPEN',
        createdAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SupportTicketModel, 'create').mockResolvedValue(mockTicket as any);
      vi.spyOn(httpsEmailService, 'sendSupportNotification').mockResolvedValue({
        success: true,
        provider: 'resend',
        messageId: 'resend_msg_001',
      });

      const result = await supportService.createTicket({
        name: 'Pratyush',
        email: 'prakash.pratyushx24@gmail.com',
        topic: '📦 Order & Delivery',
        message: 'Where is my order?',
      });

      expect(result.ticketId).toBeDefined();
      expect(result.ticketId.startsWith('TICK-')).toBe(true);
      expect(result.emailDelivered).toBe(true);
      expect(mockTicket.save).toHaveBeenCalled();
    });

    it('maintains ticket in database marked as EMAIL_FAILED if HTTPS dispatch fails', async () => {
      const mockTicket = {
        _id: 'mock_id_456',
        ticketId: 'TICK-TEST-5678',
        name: 'Customer',
        email: 'customer@example.com',
        topic: 'General Question',
        message: 'Inquiry without configured keys',
        status: 'OPEN',
        createdAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SupportTicketModel, 'create').mockResolvedValue(mockTicket as any);
      vi.spyOn(httpsEmailService, 'sendSupportNotification').mockResolvedValue({
        success: false,
        provider: 'unconfigured',
        error: 'No email service provider configured',
      });

      const result = await supportService.createTicket({
        name: 'Customer',
        email: 'customer@example.com',
        topic: 'General Question',
        message: 'Inquiry without configured keys',
      });

      // User still gets success and their ticket ID
      expect(result.ticketId).toBeDefined();
      expect(result.emailDelivered).toBe(false);
      expect(mockTicket.status).toBe('EMAIL_FAILED');
      expect(mockTicket.save).toHaveBeenCalled();
    });
  });

  describe('HttpsEmailService', () => {
    it('sets recipient strictly to SUPPORT_TO_EMAIL and Reply-To to customer email', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'res_123' }),
      });
      global.fetch = mockFetch;

      // Temporarily set RESEND_API_KEY
      const originalKey = env.RESEND_API_KEY;
      (env as any).RESEND_API_KEY = 're_test_mock_key';

      try {
        const result = await httpsEmailService.sendSupportNotification({
          ticketId: 'TICK-MOCK-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          topic: 'Payment & Wallet',
          message: 'Wallet balance deducted twice',
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.provider).toBe('resend');
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.resend.com/emails',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"to":["prakash.extra20@gmail.com"]'),
          })
        );
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.resend.com/emails',
          expect.objectContaining({
            body: expect.stringContaining('"reply_to":"jane@example.com"'),
          })
        );
      } finally {
        (env as any).RESEND_API_KEY = originalKey;
      }
    });
  });
});
