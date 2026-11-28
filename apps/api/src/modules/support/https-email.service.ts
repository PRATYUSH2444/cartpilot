import { logger } from '../../common/logging/logger.js';
import { env } from '../../config/env.config.js';

export interface SendSupportEmailParams {
  ticketId: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  createdAt: Date;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: 'brevo' | 'resend' | 'unconfigured' | 'failed';
  messageId?: string;
  error?: string;
}

export class HttpsEmailService {
  /**
   * Dispatches support notification email to the admin using HTTPS API.
   * Completely avoids SMTP (Render free tier blocks ports 25, 465, 587).
   */
  async sendSupportNotification(params: SendSupportEmailParams): Promise<EmailDispatchResult> {
    const adminToEmail = env.SUPPORT_TO_EMAIL || 'praka.extra28@gmail.com';
    const fromEmail = env.SUPPORT_FROM_EMAIL || env.RESEND_FROM_EMAIL || 'CartPilot Support <onboarding@resend.dev>';
    const subject = `[CartPilot Support: ${params.topic}] Ticket #${params.ticketId} from ${params.name}`;

    const html = this.buildSupportEmailHtml(params);

    // 1. Try Brevo HTTPS API if key is present
    if (env.BREVO_API_KEY && env.BREVO_API_KEY.trim().length > 0) {
      try {
        const cleanFromEmail = this.extractEmailAddress(fromEmail);
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': env.BREVO_API_KEY.trim(),
          },
          body: JSON.stringify({
            sender: {
              name: 'CartPilot Support Desk',
              email: cleanFromEmail || 'support@cartpilot.app',
            },
            to: [
              {
                email: adminToEmail,
                name: 'CartPilot Admin',
              },
            ],
            replyTo: {
              email: params.email,
              name: params.name,
            },
            subject,
            htmlContent: html,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error({ status: res.status, errorText, ticketId: params.ticketId }, 'Brevo HTTPS email dispatch failed');
          return {
            success: false,
            provider: 'brevo',
            error: `Brevo API HTTP ${res.status}: ${errorText}`,
          };
        }

        const data = (await res.json()) as any;
        logger.info({ messageId: data?.messageId, ticketId: params.ticketId }, '✅ Brevo HTTPS email sent successfully');
        return {
          success: true,
          provider: 'brevo',
          messageId: data?.messageId,
        };
      } catch (err: any) {
        logger.error({ err: err?.message, ticketId: params.ticketId }, 'Error connecting to Brevo HTTPS API');
        return {
          success: false,
          provider: 'brevo',
          error: err?.message || 'Network error connecting to Brevo',
        };
      }
    }

    // 2. Try Resend HTTPS API if key is present
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0 && env.RESEND_API_KEY !== 'your_resend_api_key_here') {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminToEmail],
            reply_to: params.email,
            subject,
            html,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error({ status: res.status, errorText, ticketId: params.ticketId }, 'Resend HTTPS email dispatch failed');
          return {
            success: false,
            provider: 'resend',
            error: `Resend API HTTP ${res.status}: ${errorText}`,
          };
        }

        const data = (await res.json()) as any;
        logger.info({ messageId: data?.id, ticketId: params.ticketId }, '✅ Resend HTTPS email sent successfully');
        return {
          success: true,
          provider: 'resend',
          messageId: data?.id,
        };
      } catch (err: any) {
        logger.error({ err: err?.message, ticketId: params.ticketId }, 'Error connecting to Resend HTTPS API');
        return {
          success: false,
          provider: 'resend',
          error: err?.message || 'Network error connecting to Resend',
        };
      }
    }

    // 3. Fallback when neither key is provided (e.g. local dev / test)
    logger.info(
      { ticketId: params.ticketId, to: adminToEmail, subject },
      '📧 [Email Adapter - Unconfigured] Real HTTPS email dispatch skipped (Neither BREVO_API_KEY nor RESEND_API_KEY set)'
    );
    return {
      success: false,
      provider: 'unconfigured',
      error: 'No email service provider configured (BREVO_API_KEY or RESEND_API_KEY required)',
    };
  }

  private extractEmailAddress(formatted: string): string {
    const match = formatted.match(/<([^>]+)>/);
    return match && match[1] ? match[1].trim() : formatted.trim();
  }

  private buildSupportEmailHtml(params: SendSupportEmailParams): string {
    const replyMailto = `mailto:${params.email}?subject=${encodeURIComponent(
      `Re: [CartPilot Support: ${params.topic}] Ticket #${params.ticketId}`
    )}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Support Ticket</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 32px; color: #ffffff;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a7f3d0; margin-bottom: 6px;">
              CartPilot Customer Help Desk
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
              New Support Inquiry: ${params.topic}
            </h1>
            <div style="margin-top: 10px; display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
              Ticket ID: #${params.ticketId}
            </div>
          </div>

          <!-- Body Container -->
          <div style="padding: 32px;">
            
            <!-- Customer Details Card -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px;">
                Customer Profile
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; width: 100px;">Name:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${params.name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Email:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">
                    <a href="mailto:${params.email}" style="color: #059669; text-decoration: none;">${params.email}</a>
                  </td>
                </tr>
                ${
                  params.phone
                    ? `<tr>
                        <td style="padding: 4px 0; color: #64748b;">Phone:</td>
                        <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${params.phone}</td>
                      </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Submitted:</td>
                  <td style="padding: 4px 0; color: #0f172a;">${params.createdAt.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Inquiry Message -->
            <div style="margin-bottom: 28px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">
                Customer Inquiry / Question
              </div>
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #059669; border-radius: 8px; padding: 16px 20px; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${params.message}</div>
            </div>

            <!-- Reply Button -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <a href="${replyMailto}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                ✉️ Reply Directly to Customer
              </a>
              <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                (Or hit "Reply" in your email client &mdash; Reply-To is configured to ${params.email})
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            CartPilot Agentic Commerce &bull; Pure Vegetarian Fresh Groceries &bull; Automated Support Router
          </div>

        </div>
      </body>
      </html>
    `;
  }
}

export const httpsEmailService = new HttpsEmailService();
