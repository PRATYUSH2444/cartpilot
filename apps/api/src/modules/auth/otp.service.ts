import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OtpVerificationModel, OtpPurpose } from './otp.model.js';
import { UserModel } from '../users/user.model.js';
import { BadRequestError, ForbiddenError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';
import type { AuthResult, ClientContext } from './auth.service.js';

export class OtpService {
  /**
   * Normalizes an Indian or international mobile number to standard E.164 (+91XXXXXXXXXX) format.
   */
  public static normalizePhone(phone: string): string {
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
    throw new BadRequestError('Please enter a valid 10-digit mobile number');
  }

  /**
   * Generates and dispatches a 4-digit (for login) or 6-digit OTP code to the provided phone number.
   */
  public static async sendOtp(
    phone: string,
    purpose: OtpPurpose = 'PHONE_LOGIN'
  ): Promise<{ success: boolean; message: string; simulated?: boolean; simulatedCode?: string; expiresAt: Date }> {
    const cleanPhone = this.normalizePhone(phone);

    // Rate-limit check: Prevent spamming OTP within 60 seconds
    const existing = await OtpVerificationModel.findOne({
      phone: cleanPhone,
      purpose,
      createdAt: { $gte: new Date(Date.now() - 60000) },
    });

    if (existing) {
      throw new BadRequestError('Please wait 60 seconds before requesting a new OTP');
    }

    // Generate 4-digit code for phone login (matches reference UI), 6-digit for 2FA
    const rawOtp =
      purpose === 'PHONE_LOGIN'
        ? crypto.randomInt(1000, 9999).toString()
        : crypto.randomInt(100000, 999999).toString();

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

    // Attempt real SMS carrier delivery via Twilio Programmable Messaging / Twilio Verify
    let dispatchedViaCarrier = false;
    const { TwilioSmsService } = await import('../sms/twilio-sms.service.js');
    const isTwilioActive = TwilioSmsService.isTwilioConfigured();

    if (isTwilioActive) {
      const smsResult = await TwilioSmsService.sendSms({
        to: cleanPhone,
        body: `Your CartPilot verification code is: ${rawOtp}. Valid for 5 minutes.`,
      });

      if (smsResult.success) {
        dispatchedViaCarrier = true;
      } else {
        // Real carrier was configured but failed (e.g. unverified trial number or credential issue)
        // Throw real carrier error directly so user/developer gets true feedback instead of fake fallback
        throw new BadRequestError(
          smsResult.error || 'Twilio carrier rejected SMS dispatch. Please verify your phone number or Twilio settings.'
        );
      }
    } else {
      logger.info(
        { phone: cleanPhone, rawOtp, purpose },
        '📱 [SMS Service Notice] Twilio credentials not configured in environment. Development OTP fallback active.'
      );
    }

    return {
      success: true,
      message: dispatchedViaCarrier
        ? `Real verification code dispatched via Twilio SMS to ${cleanPhone}`
        : `OTP dispatched to ${cleanPhone}. (Dev fallback: ${rawOtp})`,
      simulated: !dispatchedViaCarrier,
      simulatedCode: !dispatchedViaCarrier ? rawOtp : undefined,
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
    const cleanPhone = this.normalizePhone(phone);
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

  /**
   * Verifies a login OTP code, finds or creates the customer account, and issues authentic JWT session tokens.
   */
  public static async verifyLoginOtp(
    phone: string,
    code: string,
    name?: string,
    context: ClientContext = {}
  ): Promise<AuthResult> {
    const cleanPhone = this.normalizePhone(phone);
    const record = await OtpVerificationModel.findOne({
      phone: cleanPhone,
      purpose: 'PHONE_LOGIN',
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

    // Find existing customer or register new customer
    let user = await UserModel.findOne({ phone: cleanPhone });
    if (!user) {
      const emailPrefix = cleanPhone.replace(/\+/g, '');
      const generatedEmail = `${emailPrefix}@cartpilot.local`;
      const salt = await bcrypt.genSalt(10);
      const randomSecret = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomSecret, salt);

      user = await UserModel.create({
        name: name?.trim() || `Customer ${cleanPhone.slice(-4)}`,
        email: generatedEmail,
        phone: cleanPhone,
        role: 'CUSTOMER',
        isPhoneVerified: true,
        isActive: true,
        passwordHash,
        tokenVersion: 0,
      });

      logger.info({ userId: user._id, phone: cleanPhone }, '✨ New customer account registered via phone OTP');
    } else {
      if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }
      if (user.isSuspended) {
        throw new ForbiddenError(`Your account has been suspended: ${user.suspensionReason || 'Contact support'}`);
      }
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        throw new ForbiddenError('Account is temporarily locked. Please try again later.');
      }
    }

    const { AuthService } = await import('./auth.service.js');
    const { accessToken, refreshToken } = await AuthService.createSessionTokens(user, context);

    const isSyntheticEmail = Boolean(
      user.email &&
      (user.email.endsWith('@cartpilot.local') ||
       user.email.endsWith('@phone.cartpilot.com') ||
       user.email.endsWith('.local') ||
       user.email === 'shopper@cartpilot.local' ||
       user.email.includes('@phone.'))
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayEmail: isSyntheticEmail ? '' : user.email,
        hasRealEmail: !isSyntheticEmail,
        name: user.name,
        role: user.role,
        phone: user.phone,
        hasPhone: Boolean(user.phone && user.phone.trim()),
        avatarUrl: user.avatarUrl || '',
        mustChangePassword: false,
        isEmailVerified: user.isEmailVerified && !isSyntheticEmail,
        isPhoneVerified: Boolean(user.isPhoneVerified && user.phone),
      },
      accessToken,
      refreshToken,
    };
  }
}
