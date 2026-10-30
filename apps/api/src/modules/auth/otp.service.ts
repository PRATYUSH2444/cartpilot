import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OtpVerificationModel, OtpPurpose } from './otp.model.js';
import { UserModel } from '../users/user.model.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';
import { env } from '../../config/env.config.js';

export class OtpService {
  /**
   * Generates and dispatches a 6-digit OTP code to the provided phone number.
   */
  public static async sendOtp(
    phone: string,
    purpose: OtpPurpose = 'PHONE_VERIFICATION'
  ): Promise<{ success: boolean; message: string; simulated?: boolean; expiresAt: Date }> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanPhone)) {
      throw new BadRequestError('Phone number must be a valid E.164 formatted number (e.g. +919876543210)');
    }

    // Rate-limit check: Prevent spamming OTP within 60 seconds
    const existing = await OtpVerificationModel.findOne({
      phone: cleanPhone,
      purpose,
      createdAt: { $gte: new Date(Date.now() - 60000) },
    });

    if (existing) {
      throw new BadRequestError('Please wait 60 seconds before requesting a new OTP');
    }

    // Generate 6-digit cryptographic numeric code
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Invalidate prior active OTPs for this phone/purpose
    await OtpVerificationModel.deleteMany({ phone: cleanPhone, purpose });

    await OtpVerificationModel.create({
      phone: cleanPhone,
      hashedOtp,
      purpose,
      attempts: 0,
      isVerified: false,
      expiresAt,
    });

    // Attempt real SMS carrier delivery via Twilio if configured
    let dispatchedViaCarrier = false;
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      try {
        const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const params = new URLSearchParams();
        params.append('To', cleanPhone);
        params.append('From', env.TWILIO_PHONE_NUMBER);
        params.append('Body', `Your CartPilot verification code is: ${rawOtp}. Valid for 5 minutes.`);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (twilioRes.ok) {
          dispatchedViaCarrier = true;
          logger.info({ phone: cleanPhone }, '✅ Real SMS OTP dispatched via Twilio carrier gateway');
        } else {
          const errText = await twilioRes.text();
          logger.warn({ errText, phone: cleanPhone }, 'Twilio SMS dispatch failed');
        }
      } catch (err) {
        logger.error({ err, phone: cleanPhone }, 'Error communicating with Twilio SMS gateway');
      }
    }

    if (!dispatchedViaCarrier) {
      logger.info(
        { phone: cleanPhone, rawOtp, purpose },
        '📱 [SMS Service Notice] SMS carrier unconfigured. Development OTP generated securely.'
      );
    }

    return {
      success: true,
      message: dispatchedViaCarrier
        ? `Verification code dispatched via SMS to ${cleanPhone}`
        : `OTP generated for ${cleanPhone} (Carrier unconfigured; check server log or use development code: ${rawOtp})`,
      simulated: !dispatchedViaCarrier,
      expiresAt,
    };
  }

  /**
   * Verifies an OTP code and updates the user's phone verification state.
   */
  public static async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose = 'PHONE_VERIFICATION',
    userId?: string
  ): Promise<{ verified: boolean; message: string }> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const record = await OtpVerificationModel.findOne({
      phone: cleanPhone,
      purpose,
      isVerified: false,
    });

    if (!record) {
      throw new BadRequestError('Invalid or expired OTP. Please request a new verification code.');
    }

    if (record.attempts >= 3) {
      await OtpVerificationModel.findByIdAndDelete(record._id);
      throw new BadRequestError('Too many failed attempts. This OTP has been invalidated. Please request a new code.');
    }

    const matches = await bcrypt.compare(code.trim(), record.hashedOtp);
    if (!matches) {
      record.attempts += 1;
      await record.save();
      throw new BadRequestError(`Incorrect OTP code. ${3 - record.attempts} attempts remaining.`);
    }

    record.isVerified = true;
    await record.save();

    // If userId provided or phone matches a registered user, mark phone as verified
    if (userId) {
      await UserModel.findByIdAndUpdate(userId, { isPhoneVerified: true, phone: cleanPhone });
    } else {
      await UserModel.findOneAndUpdate({ phone: cleanPhone }, { isPhoneVerified: true });
    }

    return {
      verified: true,
      message: 'Phone number verified successfully!',
    };
  }
}
