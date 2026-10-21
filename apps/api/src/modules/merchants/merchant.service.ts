import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MerchantModel, IMerchant, MerchantStatus } from './merchant.model.js';
import { ProductModel, IProduct } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { MerchantUserModel, MerchantPermission } from './merchant-user.model.js';
import { StaffInvitationModel } from './staff-invitation.model.js';
import { SessionModel } from '../auth/session.model.js';
import { AuthService, AuthResult, ClientContext } from '../auth/auth.service.js';
import { auditService } from '../audit/audit.service.js';
import { emailAdapter } from '../../integrations/email/email-adapter.js';
import { validatePasswordStrength } from '../../common/utils/password-validator.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../../common/errors/app-error.js';
import {
  ApplyMerchantInput,
  InviteStaffInput,
  AcceptStaffInviteInput,
} from '../auth/auth.schema.js';

export class MerchantService {
  /**
   * List approved and active merchants for shopping catalog.
   */
  static async listActiveMerchants(): Promise<IMerchant[]> {
    return MerchantModel.find({ isActive: true, status: 'APPROVED' }).sort({ rating: -1, businessName: 1 });
  }

  /**
   * Get single merchant by ID (active only for shoppers).
   */
  static async getMerchantById(id: string): Promise<IMerchant> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    const merchant = await MerchantModel.findById(id);
    if (!merchant || !merchant.isActive || merchant.status !== 'APPROVED') {
      throw new NotFoundError('Merchant not found or not active');
    }
    return merchant;
  }

  /**
   * Admin or merchant owner get merchant profile regardless of active state.
   */
  static async getMerchantDetails(id: string): Promise<IMerchant> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    const merchant = await MerchantModel.findById(id);
    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }
    return merchant;
  }

  static async getMerchantBySlug(slug: string): Promise<IMerchant> {
    const merchant = await MerchantModel.findOne({ slug: slug.toLowerCase(), isActive: true, status: 'APPROVED' });
    if (!merchant) {
      throw new NotFoundError(`Merchant with slug '${slug}' not found`);
    }
    return merchant;
  }

  static async getMerchantProducts(merchantId: string): Promise<IProduct[]> {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    return ProductModel.find({ merchantId, isActive: true }).sort({ name: 1 });
  }

  /**
   * Public "Become a Merchant" application flow.
   * Creates an owner user, a merchant record in PENDING status, and maps owner permissions.
   */
  static async applyMerchant(input: ApplyMerchantInput, context: ClientContext = {}): Promise<AuthResult & { merchant: IMerchant }> {
    if (!input.vegetarianDeclaration) {
      throw new BadRequestError('Merchant must certify 100% pure vegetarian compliance');
    }

    const passwordCheck = validatePasswordStrength(input.password);
    if (!passwordCheck.isValid) {
      throw new BadRequestError(passwordCheck.message || 'Password does not meet security requirements');
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Slug generation with collision avoidance
    let baseSlug = input.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'merchant';

    let slug = baseSlug;
    let counter = 1;
    while (await MerchantModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // 1. Create merchant in PENDING status (isActive = false until approved)
    const merchant = await MerchantModel.create({
      businessName: input.storeName.trim(),
      slug,
      contactEmail: normalizedEmail,
      contactPhone: input.phone.trim(),
      isActive: false, // Cannot take customer orders until approved
      status: 'PENDING',
      rating: 5.0,
      isVegetarianCertified: true,
      serviceAreaPincodes: input.serviceAreaPincodes || ['560001', '560034'],
      address: {
        street: input.street.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        postalCode: input.postalCode.trim(),
      },
      applicationSubmittedAt: new Date(),
    });

    // 2. Create owner user
    const user = await UserModel.create({
      name: input.ownerName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'MERCHANT',
      phone: input.phone.trim(),
      isActive: true,
      tokenVersion: 0,
      failedLoginAttempts: 0,
      isSuspended: false,
      isEmailVerified: false,
    });

    // 3. Create MerchantUser mapping with OWNER role
    await MerchantUserModel.create({
      userId: user._id,
      merchantId: merchant._id,
      role: 'OWNER',
      permissions: ['orders.update', 'products.edit', 'stock.adjust', 'pricing.edit', 'settings.edit'],
    });

    // 4. Create initial authenticated session
    const { accessToken, refreshToken } = await AuthService.createSessionTokens(
      user,
      context,
      undefined,
      merchant._id.toString(),
      false,
      ['orders.update', 'products.edit', 'stock.adjust', 'pricing.edit', 'settings.edit']
    );

    await auditService.recordEvent({
      eventType: 'MERCHANT_APPLICATION_SUBMITTED',
      actorId: user._id.toString(),
      actorRole: 'MERCHANT',
      resourceId: merchant._id.toString(),
      resourceType: 'MERCHANT',
      payload: {
        storeName: merchant.businessName,
        slug: merchant.slug,
        contactEmail: merchant.contactEmail,
        status: merchant.status,
      },
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId: merchant._id.toString(),
        isStaff: false,
      },
      merchant,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Admin approves, rejects, suspends, or restores a merchant.
   */
  static async updateMerchantStatus(
    merchantId: string,
    action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESTORE',
    adminId: string,
    reason?: string
  ): Promise<IMerchant> {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }

    const merchant = await MerchantModel.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    let targetStatus: MerchantStatus;
    if (action === 'APPROVE' || action === 'RESTORE') {
      targetStatus = 'APPROVED';
      merchant.isActive = true;
      merchant.rejectionReason = null;
      merchant.suspensionReason = null;
    } else if (action === 'REJECT') {
      targetStatus = 'REJECTED';
      merchant.isActive = false;
      merchant.rejectionReason = reason || 'Application did not meet marketplace requirements';
    } else {
      targetStatus = 'SUSPENDED';
      merchant.isActive = false;
      merchant.suspensionReason = reason || 'Suspended by compliance officer';
    }

    merchant.status = targetStatus;
    await merchant.save();

    // Dispatch status notification email
    await emailAdapter.sendMerchantStatusEmail(
      merchant.contactEmail,
      merchant.businessName,
      targetStatus,
      reason
    );

    await auditService.recordEvent({
      eventType: 'MERCHANT_STATUS_UPDATED',
      actorId: adminId,
      actorRole: 'ADMIN',
      resourceId: merchant._id.toString(),
      resourceType: 'MERCHANT',
      payload: {
        action,
        newStatus: targetStatus,
        reason: reason || null,
      },
    });

    return merchant;
  }

  /**
   * Merchant owner invites a staff member with explicit permission flags.
   */
  static async inviteStaff(
    merchantId: string,
    ownerUserId: string,
    input: InviteStaffInput
  ): Promise<{ invitationId: string; inviteToken?: string; email: string; permissions: MerchantPermission[]; expiresAt: Date; devInviteLink?: string }> {
    const ownerMapping = await MerchantUserModel.findOne({
      userId: new mongoose.Types.ObjectId(ownerUserId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
      role: 'OWNER',
    });

    if (!ownerMapping) {
      throw new ForbiddenError('Only the merchant owner can invite staff members');
    }

    const merchant = await MerchantModel.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError('Merchant store not found');
    }

    const normalizedEmail = input.email.toLowerCase().trim();

    // Generate single-use secure invite token (valid 7 days)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await StaffInvitationModel.create({
      merchantId: merchant._id,
      invitedByUserId: new mongoose.Types.ObjectId(ownerUserId),
      email: normalizedEmail,
      name: input.name.trim(),
      permissions: input.permissions,
      tokenHash,
      expiresAt,
      isAccepted: false,
      isRevoked: false,
    });

    await emailAdapter.sendStaffInvitationEmail(
      normalizedEmail,
      merchant.businessName,
      rawToken,
      input.permissions
    );

    await auditService.recordEvent({
      eventType: 'STAFF_INVITED',
      actorId: ownerUserId,
      actorRole: 'MERCHANT',
      resourceId: invitation._id.toString(),
      resourceType: 'STAFF',
      payload: {
        merchantId,
        staffEmail: normalizedEmail,
        permissions: input.permissions,
      },
    });

    const devInviteLink = `/accept-invite?token=${rawToken}`;

    return {
      invitationId: invitation._id.toString(),
      inviteToken: rawToken,
      email: normalizedEmail,
      permissions: input.permissions as MerchantPermission[],
      expiresAt,
      devInviteLink,
    };
  }

  /**
   * Staff accepts an unexpired invitation, creates their account and merchant mapping.
   */
  static async acceptStaffInvite(
    input: AcceptStaffInviteInput,
    context: ClientContext = {}
  ): Promise<AuthResult> {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const invitation = await StaffInvitationModel.findOne({
      tokenHash,
      isAccepted: false,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new BadRequestError('Invitation link is invalid, already used, or has expired');
    }

    const passwordCheck = validatePasswordStrength(input.password);
    if (!passwordCheck.isValid) {
      throw new BadRequestError(passwordCheck.message || 'Password does not meet security requirements');
    }

    // Check if user account already exists with this email
    let user = await UserModel.findOne({ email: invitation.email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);
      user = await UserModel.create({
        name: invitation.name,
        email: invitation.email,
        passwordHash,
        role: 'MERCHANT',
        isActive: true,
        isStaff: true,
        tokenVersion: 0,
      });
    }

    // Create staff mapping
    await MerchantUserModel.findOneAndUpdate(
      { userId: user._id, merchantId: invitation.merchantId },
      {
        userId: user._id,
        merchantId: invitation.merchantId,
        role: 'STAFF',
        permissions: invitation.permissions,
      },
      { upsert: true, new: true }
    );

    // Mark invitation accepted
    invitation.isAccepted = true;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Issue tokens for new staff member
    const { accessToken, refreshToken } = await AuthService.createSessionTokens(
      user,
      context,
      undefined,
      invitation.merchantId.toString(),
      true,
      invitation.permissions
    );

    await auditService.recordEvent({
      eventType: 'STAFF_INVITATION_ACCEPTED',
      actorId: user._id.toString(),
      actorRole: 'MERCHANT',
      resourceId: invitation._id.toString(),
      resourceType: 'STAFF',
      payload: {
        merchantId: invitation.merchantId.toString(),
        email: invitation.email,
        permissions: invitation.permissions,
      },
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'MERCHANT',
        merchantId: invitation.merchantId.toString(),
        isStaff: true,
        staffPermissions: invitation.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * List staff members and pending invitations for a merchant store.
   */
  static async listMerchantStaff(
    merchantId: string,
    currentUserId: string
  ): Promise<{ staff: Array<Record<string, unknown>>; pendingInvitations: Array<Record<string, unknown>> }> {
    const isMember = await MerchantUserModel.findOne({
      userId: new mongoose.Types.ObjectId(currentUserId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    });

    if (!isMember) {
      throw new ForbiddenError('Access denied: You are not a member of this merchant team');
    }

    const staffMappings = await MerchantUserModel.find({
      merchantId: new mongoose.Types.ObjectId(merchantId),
    })
      .populate('userId', 'name email createdAt isSuspended')
      .lean();

    const staff = staffMappings.map((m) => {
      const u = m.userId as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string; createdAt: Date; isSuspended: boolean };
      return {
        id: m._id.toString(),
        userId: u?._id?.toString(),
        name: u?.name || 'Unknown',
        email: u?.email || 'Unknown',
        role: m.role,
        permissions: m.permissions || [],
        isSuspended: u?.isSuspended || false,
      };
    });

    const pendingInvitations = await StaffInvitationModel.find({
      merchantId: new mongoose.Types.ObjectId(merchantId),
      isAccepted: false,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      staff,
      pendingInvitations: pendingInvitations.map((i) => ({
        id: i._id.toString(),
        email: i.email,
        name: i.name,
        permissions: i.permissions,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    };
  }

  /**
   * Revoke a staff member's store access and terminate their sessions.
   */
  static async revokeStaff(
    merchantId: string,
    ownerUserId: string,
    staffUserId: string
  ): Promise<void> {
    const ownerMapping = await MerchantUserModel.findOne({
      userId: new mongoose.Types.ObjectId(ownerUserId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
      role: 'OWNER',
    });

    if (!ownerMapping) {
      throw new ForbiddenError('Only the merchant owner can remove staff members');
    }

    if (ownerUserId === staffUserId) {
      throw new BadRequestError('Merchant owner cannot remove themselves from the store');
    }

    // 1. Remove mapping
    await MerchantUserModel.deleteOne({
      userId: new mongoose.Types.ObjectId(staffUserId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    });

    // 2. Revoke all active sessions for this staff user
    await SessionModel.updateMany(
      { userId: new mongoose.Types.ObjectId(staffUserId) },
      { isRevoked: true }
    );
    await UserModel.updateOne(
      { _id: new mongoose.Types.ObjectId(staffUserId) },
      {
        $inc: { tokenVersion: 1 },
        isSuspended: true,
        suspensionReason: 'Store staff access revoked by owner',
      }
    );

    await auditService.recordEvent({
      eventType: 'STAFF_REVOKED',
      actorId: ownerUserId,
      actorRole: 'MERCHANT',
      resourceId: staffUserId,
      resourceType: 'STAFF',
      payload: { merchantId, staffUserId },
    });
  }
}
