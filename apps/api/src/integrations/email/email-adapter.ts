import { logger } from '../../common/logging/logger.js';
import { env } from '../../config/env.config.js';

export interface IEmailAdapter {
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendStaffInvitationEmail(
    email: string,
    storeName: string,
    inviteToken: string,
    permissions: string[]
  ): Promise<void>;
  sendMerchantStatusEmail(
    email: string,
    storeName: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'RESTORED',
    reason?: string
  ): Promise<void>;
  sendEmailVerification(email: string, token: string): Promise<void>;
}

export class ConsoleEmailAdapter implements IEmailAdapter {
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    logger.info(
      {
        to: email,
        type: 'PASSWORD_RESET',
        resetUrl,
      },
      '📧 [Email Adapter - Console Transport] Password reset dispatch'
    );
  }

  async sendStaffInvitationEmail(
    email: string,
    storeName: string,
    inviteToken: string,
    permissions: string[]
  ): Promise<void> {
    const inviteUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/accept-invite?token=${inviteToken}`;
    logger.info(
      {
        to: email,
        storeName,
        permissions,
        inviteUrl,
      },
      '📧 [Email Adapter - Console Transport] Staff invitation dispatch'
    );
  }

  async sendMerchantStatusEmail(
    email: string,
    storeName: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'RESTORED',
    reason?: string
  ): Promise<void> {
    logger.info(
      {
        to: email,
        storeName,
        status,
        reason: reason || 'N/A',
      },
      `📧 [Email Adapter - Console Transport] Merchant status changed to ${status}`
    );
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verifyUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/verify-email?token=${token}`;
    logger.info(
      {
        to: email,
        type: 'EMAIL_VERIFICATION',
        verifyUrl,
      },
      '📧 [Email Adapter - Console Transport] Email verification dispatch'
    );
  }
}

// Global default email adapter instance
export const emailAdapter: IEmailAdapter = new ConsoleEmailAdapter();
