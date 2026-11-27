import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  role: z.enum(['CUSTOMER', 'MERCHANT']).default('CUSTOMER'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const phoneOtpSendSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number is required').trim(),
  purpose: z
    .enum(['PHONE_VERIFICATION', 'LOGIN_2FA', 'PASSWORD_RESET', 'PHONE_LOGIN'])
    .default('PHONE_LOGIN'),
});

export const phoneOtpLoginSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number is required').trim(),
  code: z.string().min(4, 'Valid verification code is required').max(6).trim(),
  name: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const forceChangePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  currentAdminPassword: z.string().min(1, 'Current administrator password confirmation is required'),
});

export const applyMerchantSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters long').trim(),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters long').trim(),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').trim(),
  street: z.string().min(3, 'Street address is required').trim(),
  city: z.string().min(2, 'City is required').trim().default('Patna'),
  state: z.string().min(2, 'State is required').trim().default('Bihar'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Valid 6-digit postal code is required'),
  serviceAreaPincodes: z.array(z.string().regex(/^[1-9][0-9]{5}$/)).default(['560001', '560034']),
  vegetarianDeclaration: z.literal(true, {
    errorMap: () => ({ message: 'You must certify that the store offers strictly 100% vegetarian products' }),
  }),
});

export const inviteStaffSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  name: z.string().min(2, 'Staff member name is required').trim(),
  permissions: z
    .array(
      z.enum(['orders.update', 'products.edit', 'stock.adjust', 'pricing.edit', 'settings.edit'])
    )
    .min(1, 'At least one permission flag is required'),
});

export const acceptStaffInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const merchantStatusActionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Valid administrator email is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const adminMfaVerifySchema = z.object({
  mfaToken: z.string().min(1, 'MFA challenge session token is required'),
  code: z.string().length(6, '6-digit MFA verification code is required').trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminMfaVerifyInput = z.infer<typeof adminMfaVerifySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForceChangePasswordInput = z.infer<typeof forceChangePasswordSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type ApplyMerchantInput = z.infer<typeof applyMerchantSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type AcceptStaffInviteInput = z.infer<typeof acceptStaffInviteSchema>;
export type MerchantStatusActionInput = z.infer<typeof merchantStatusActionSchema>;
