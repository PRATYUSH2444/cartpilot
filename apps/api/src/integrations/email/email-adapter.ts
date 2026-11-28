import { logger } from '../../common/logging/logger.js';
import { env } from '../../config/env.config.js';

export interface OrderEmailDetails {
  orderNumber: string;
  totalPaise: number;
  formattedTotal: string;
  itemsCount: number;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPincode: string;
}

export interface IEmailAdapter {
  sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean>;
  sendStaffInvitationEmail(
    email: string,
    storeName: string,
    inviteToken: string,
    permissions: string[]
  ): Promise<boolean>;
  sendMerchantStatusEmail(
    email: string,
    storeName: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'RESTORED',
    reason?: string
  ): Promise<boolean>;
  sendEmailVerification(email: string, token: string): Promise<boolean>;
  sendOrderConfirmationEmail(email: string, details: OrderEmailDetails): Promise<boolean>;
  sendLowBalanceAlertEmail(email: string, balanceRupees: number): Promise<boolean>;
  sendRefundConfirmationEmail(email: string, orderNumber: string, refundRupees: number): Promise<boolean>;
}

export class ResendEmailAdapter implements IEmailAdapter {
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(apiKey?: string, fromEmail?: string) {
    this.apiKey = apiKey || env.RESEND_API_KEY || '';
    this.fromEmail = fromEmail || env.RESEND_FROM_EMAIL || 'CartPilot <onboarding@resend.dev>';
  }

  private async dispatchEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey || this.apiKey.trim().length === 0 || this.apiKey === 'your_resend_api_key_here') {
      logger.info({ to, subject }, '📧 [Email Adapter - Unconfigured] Real email dispatch skipped (No RESEND_API_KEY)');
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error({ status: res.status, errorText, to, subject }, 'Resend API email dispatch failed');
        return false;
      }

      const data = await res.json();
      logger.info({ id: (data as any)?.id, to, subject }, '✅ Resend API email dispatched successfully');
      return true;
    } catch (err) {
      logger.error({ err, to, subject }, 'Error connecting to Resend API');
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 16px;">CartPilot Security</h2>
        <p style="font-size: 15px; color: #374151;">You requested a password reset for your CartPilot account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af;">CartPilot Agentic Commerce — Pure Vegetarian Quick Delivery</p>
      </div>
    `;
    return this.dispatchEmail(email, 'Reset your CartPilot Password', html);
  }

  async sendStaffInvitationEmail(
    email: string,
    storeName: string,
    inviteToken: string,
    permissions: string[]
  ): Promise<boolean> {
    const inviteUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/accept-invite?token=${inviteToken}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 16px;">Invitation to join ${storeName} on CartPilot</h2>
        <p style="font-size: 15px; color: #374151;">You have been invited to collaborate as staff for <strong>${storeName}</strong>.</p>
        <p style="font-size: 13px; color: #6b7280;">Assigned permissions: ${permissions.join(', ')}</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Accept Invitation</a>
        </p>
      </div>
    `;
    return this.dispatchEmail(email, `Join ${storeName} on CartPilot`, html);
  }

  async sendMerchantStatusEmail(
    email: string,
    storeName: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'RESTORED',
    reason?: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 16px;">Store Status Update: ${status}</h2>
        <p style="font-size: 15px; color: #374151;">Your merchant account for <strong>${storeName}</strong> status has been updated to <strong>${status}</strong>.</p>
        ${reason ? `<p style="font-size: 14px; color: #dc2626; background: #fef2f2; padding: 12px; border-radius: 6px;">Reason: ${reason}</p>` : ''}
      </div>
    `;
    return this.dispatchEmail(email, `CartPilot Merchant Status: ${status}`, html);
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 16px;">Verify your Email</h2>
        <p style="font-size: 15px; color: #374151;">Welcome to CartPilot! Please verify your email address to activate your autonomous shopping account.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email</a>
        </p>
      </div>
    `;
    return this.dispatchEmail(email, 'Verify your CartPilot Account', html);
  }

  async sendOrderConfirmationEmail(email: string, details: OrderEmailDetails): Promise<boolean> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0;">Order Confirmed!</h2>
          <span style="font-family: monospace; font-size: 14px; background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 4px;">#${details.orderNumber}</span>
        </div>
        <p style="font-size: 15px; color: #374151;">Thank you for your order! Your groceries are being packed and prepared for express delivery.</p>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Total Items:</span>
            <span style="font-weight: 600; font-size: 14px;">${details.itemsCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280; font-size: 14px;">Total Paid:</span>
            <span style="font-weight: 700; font-size: 16px; color: #059669;">${details.formattedTotal}</span>
          </div>
          <div style="margin-top: 12px; pt: 12px; border-top: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 13px;">Delivering To:</span>
            <p style="font-size: 13px; color: #374151; margin: 4px 0 0 0;">${details.deliveryStreet}, ${details.deliveryCity} - ${details.deliveryPincode}</p>
          </div>
        </div>
        
        <p style="font-size: 12px; color: #6b7280;">100% Certified Vegetarian Produce Guaranteed.</p>
      </div>
    `;
    return this.dispatchEmail(email, `Order Confirmed: #${details.orderNumber}`, html);
  }

  async sendLowBalanceAlertEmail(email: string, balanceRupees: number): Promise<boolean> {
    const topUpUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/shopper`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 20px;">CartPilot Wallet Notice</h2>
          <span style="font-family: monospace; font-size: 13px; background: #f0fdf4; color: #166534; padding: 4px 8px; border-radius: 6px; font-weight: 700;">₹${balanceRupees.toFixed(2)} Balance</span>
        </div>
        <p style="font-size: 15px; color: #374151; line-height: 1.5;">Your CartPilot grocery wallet balance is currently running low.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
            To ensure your upcoming morning grocery baskets and daily milk provisions execute seamlessly without manual intervention, please top up your balance when convenient.
          </p>
        </div>
        <p style="margin: 24px 0;">
          <a href="${topUpUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Top Up Wallet</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Zero transaction fees on all CartPilot 1-tap wallet top-ups.</p>
      </div>
    `;
    return this.dispatchEmail(email, `CartPilot Balance Notice: ₹${balanceRupees.toFixed(0)} Remaining`, html);
  }

  async sendRefundConfirmationEmail(email: string, orderNumber: string, refundRupees: number): Promise<boolean> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 20px;">Refund Processed</h2>
          <span style="font-family: monospace; font-size: 13px; background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 6px; font-weight: 700;">#${orderNumber}</span>
        </div>
        <p style="font-size: 15px; color: #374151; line-height: 1.5;">We have processed a refund of <strong>₹${refundRupees.toFixed(2)}</strong> for Order #${orderNumber}.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">
            ✓ Credited to your CartPilot Wallet with 0 delay.
          </p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #15803d;">
            The funds are immediately available for your next harvest order or scheduled morning essentials.
          </p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">CartPilot Agentic Commerce — Pure Vegetarian Quick Delivery</p>
      </div>
    `;
    return this.dispatchEmail(email, `Refund Credited: ₹${refundRupees.toFixed(2)} for #${orderNumber}`, html);
  }
}

export class ConsoleEmailAdapter implements IEmailAdapter {
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    logger.info({ to: email, type: 'PASSWORD_RESET', resetUrl }, '📧 [Console Email] Password reset dispatch');
    return true;
  }

  async sendStaffInvitationEmail(
    email: string,
    storeName: string,
    inviteToken: string,
    permissions: string[]
  ): Promise<boolean> {
    const inviteUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/accept-invite?token=${inviteToken}`;
    logger.info({ to: email, storeName, permissions, inviteUrl }, '📧 [Console Email] Staff invitation dispatch');
    return true;
  }

  async sendMerchantStatusEmail(
    email: string,
    storeName: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'RESTORED',
    reason?: string
  ): Promise<boolean> {
    logger.info({ to: email, storeName, status, reason }, '📧 [Console Email] Merchant status dispatch');
    return true;
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${env.isProduction ? 'https://cartpilot.app' : 'http://localhost:5173'}/verify-email?token=${token}`;
    logger.info({ to: email, verifyUrl }, '📧 [Console Email] Verification email dispatch');
    return true;
  }

  async sendOrderConfirmationEmail(email: string, details: OrderEmailDetails): Promise<boolean> {
    logger.info({ to: email, details }, '📧 [Console Email] Order confirmation dispatch');
    return true;
  }

  async sendLowBalanceAlertEmail(email: string, balanceRupees: number): Promise<boolean> {
    logger.info({ to: email, balanceRupees }, '📧 [Console Email] Low balance alert dispatch');
    return true;
  }

  async sendRefundConfirmationEmail(email: string, orderNumber: string, refundRupees: number): Promise<boolean> {
    logger.info({ to: email, orderNumber, refundRupees }, '📧 [Console Email] Refund confirmation dispatch');
    return true;
  }
}

export class EmailService {
  private static instance: IEmailAdapter | null = null;

  public static getAdapter(): IEmailAdapter {
    if (!this.instance) {
      if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 'your_resend_api_key_here') {
        logger.info('Initializing Real Resend Email Service');
        this.instance = new ResendEmailAdapter(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
      } else {
        logger.info('Initializing Console Email Service (RESEND_API_KEY unconfigured)');
        this.instance = new ConsoleEmailAdapter();
      }
    }
    return this.instance;
  }

  public static setAdapter(adapter: IEmailAdapter): void {
    this.instance = adapter;
  }
}

export const emailAdapter: IEmailAdapter = {
  sendPasswordResetEmail: (email, token) => EmailService.getAdapter().sendPasswordResetEmail(email, token),
  sendStaffInvitationEmail: (email, storeName, inviteToken, permissions) =>
    EmailService.getAdapter().sendStaffInvitationEmail(email, storeName, inviteToken, permissions),
  sendMerchantStatusEmail: (email, storeName, status, reason) =>
    EmailService.getAdapter().sendMerchantStatusEmail(email, storeName, status, reason),
  sendEmailVerification: (email, token) => EmailService.getAdapter().sendEmailVerification(email, token),
  sendOrderConfirmationEmail: (email, details) => EmailService.getAdapter().sendOrderConfirmationEmail(email, details),
  sendLowBalanceAlertEmail: (email, balanceRupees) => EmailService.getAdapter().sendLowBalanceAlertEmail(email, balanceRupees),
  sendRefundConfirmationEmail: (email, orderNumber, refundRupees) => EmailService.getAdapter().sendRefundConfirmationEmail(email, orderNumber, refundRupees),
};
