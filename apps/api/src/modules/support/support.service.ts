import mongoose from 'mongoose';
import { SupportTicketModel, SupportTopic, ISupportTicket } from './support-ticket.model.js';
import { httpsEmailService } from './https-email.service.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';
import { UserModel } from '../users/user.model.js';

export interface CreateTicketDTO {
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  topic: string;
  message: string;
}

const VALID_TOPICS: SupportTopic[] = [
  'Order & Delivery',
  'Payment & Wallet',
  'Item Quality',
  'General Question',
  'Rating & Feedback',
];

export class SupportService {
  /**
   * Cleans and normalizes incoming topic (e.g., strips emojis like '📦 Order & Delivery')
   */
  normalizeTopic(rawTopic: string): SupportTopic {
    if (!rawTopic || typeof rawTopic !== 'string') {
      throw new BadRequestError('Topic is required');
    }
    const cleanTopic = rawTopic.replace(/[^\w\s&]/gi, '').trim();
    const matched = VALID_TOPICS.find(
      (vt) => vt.toLowerCase() === cleanTopic.toLowerCase() || rawTopic.includes(vt)
    );
    if (!matched) {
      throw new BadRequestError(
        `Invalid topic. Supported topics: ${VALID_TOPICS.join(', ')}`
      );
    }
    return matched;
  }

  /**
   * Basic HTML sanitization to prevent XSS in email and ticket bodies
   */
  sanitizeMessage(msg: string): string {
    if (!msg || typeof msg !== 'string') return '';
    return msg
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generates a clean human-readable support ticket ID (e.g. TICK-M1A2B-7F49)
   */
  private generateTicketId(): string {
    const timeSegment = Date.now().toString(36).toUpperCase();
    const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TICK-${timeSegment}-${randomSegment}`;
  }

  async createTicket(dto: CreateTicketDTO): Promise<{
    ticket: ISupportTicket;
    ticketId: string;
    emailDelivered: boolean;
    message: string;
  }> {
    // 1. Validate & normalize inputs
    const topic = this.normalizeTopic(dto.topic);
    const rawMessage = (dto.message || '').trim();

    if (!rawMessage || rawMessage.length < 1) {
      throw new BadRequestError('Inquiry message is required');
    }
    if (rawMessage.length > 1000) {
      throw new BadRequestError('Inquiry message cannot exceed 1000 characters');
    }

    const sanitizedMessage = this.sanitizeMessage(rawMessage);

    // 2. Resolve user contact details
    let resolvedName = (dto.name || '').trim();
    let resolvedEmail = (dto.email || '').trim().toLowerCase();
    let resolvedPhone = (dto.phone || '').trim();
    let resolvedUserId: mongoose.Types.ObjectId | undefined;

    if (dto.userId) {
      try {
        if (mongoose.Types.ObjectId.isValid(dto.userId)) {
          resolvedUserId = new mongoose.Types.ObjectId(dto.userId);
          const dbUser = await UserModel.findById(resolvedUserId);
          if (dbUser) {
            resolvedName = resolvedName || dbUser.name || 'Shopper';
            resolvedEmail = resolvedEmail || dbUser.email;
            resolvedPhone = resolvedPhone || dbUser.phone || '';
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Could not resolve user details for support ticket');
      }
    }

    if (!resolvedEmail) {
      throw new BadRequestError('Customer email address is required');
    }
    if (!resolvedName) {
      resolvedName = 'Valued Customer';
    }

    // 3. SAVE FIRST in MongoDB (never lose a customer inquiry)
    const ticketId = this.generateTicketId();
    const ticket = await SupportTicketModel.create({
      ticketId,
      userId: resolvedUserId,
      name: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      topic,
      message: sanitizedMessage,
      status: 'OPEN',
      emailDelivered: false,
    });

    logger.info({ ticketId, topic, email: resolvedEmail }, 'Support ticket created and saved to database');

    // 4. Dispatch Email to Admin via HTTPS API (Render free-tier safe, no SMTP)
    let emailDelivered = false;
    try {
      const emailResult = await httpsEmailService.sendSupportNotification({
        ticketId,
        name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        topic,
        message: sanitizedMessage,
        createdAt: ticket.createdAt,
      });

      if (emailResult.success) {
        ticket.status = 'EMAIL_SENT';
        ticket.emailDelivered = true;
        ticket.emailProvider = emailResult.provider;
        ticket.emailMessageId = emailResult.messageId;
        await ticket.save();
        emailDelivered = true;
      } else {
        ticket.status = 'EMAIL_FAILED';
        ticket.emailDelivered = false;
        ticket.emailProvider = emailResult.provider;
        ticket.emailError = emailResult.error;
        await ticket.save();
        logger.warn(
          { ticketId, provider: emailResult.provider, error: emailResult.error },
          'Support ticket email notification was not delivered; ticket preserved in database'
        );
      }
    } catch (sendErr: any) {
      ticket.status = 'EMAIL_FAILED';
      ticket.emailDelivered = false;
      ticket.emailError = sendErr?.message || 'Unexpected email delivery exception';
      await ticket.save();
      logger.error({ sendErr, ticketId }, 'Unhandled exception sending support notification email');
    }

    return {
      ticket,
      ticketId,
      emailDelivered,
      message: 'Your inquiry has been received. Our support team will get back to your email shortly.',
    };
  }

  async getTicketsByUserId(userId: string): Promise<ISupportTicket[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    return SupportTicketModel.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20);
  }
}

export const supportService = new SupportService();
