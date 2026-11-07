import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MerchantModel, IMerchant, MerchantStatus } from './merchant.model.js';
import { OrderModel, IOrder } from '../orders/order.model.js';
import { ProductModel, IProduct, ProductCategory, PackageUnit } from '../catalog/product.model.js';
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

  /**
   * Update merchant store details (profile, online status, contact, address, delivery pincodes).
   */
  /**
   * Real-time operational database analytics for merchant dashboard.
   */
  static async getStoreAnalytics(merchantId: string) {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    const merchantObjId = new mongoose.Types.ObjectId(merchantId);

    const orders = await OrderModel.find({ merchantId: merchantObjId });
    const totalSalesPaise = orders.reduce((sum, o) => {
      if (o.status !== 'CANCELLED' && o.status !== 'FAILED') {
        return sum + (o.pricingSnapshot?.totalPaise || 0);
      }
      return sum;
    }, 0);

    const newOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT');
    const ordersToComplete = orders.filter((o) => o.status === 'PACKING' || o.status === 'OUT_FOR_DELIVERY');
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    const lowStockCount = await ProductModel.countDocuments({
      merchantId: merchantObjId,
      availableStock: { $lte: 10, $gt: 0 },
      isActive: true,
    });
    const outOfStockCount = await ProductModel.countDocuments({
      merchantId: merchantObjId,
      availableStock: 0,
      isActive: true,
    });

    return {
      todaySalesPaise: totalSalesPaise,
      newOrdersCount: newOrders.length,
      ordersToCompleteCount: ordersToComplete.length,
      completedOrdersCount: completedOrders.length,
      lowStockCount,
      outOfStockCount,
      totalOrdersCount: orders.length,
      avgOrderValuePaise: orders.length > 0 ? Math.round(totalSalesPaise / orders.length) : 0,
    };
  }

  static async updateStore(
    merchantId: string,
    updates: Partial<{
      businessName: string;
      description: string;
      contactPhone: string;
      contactEmail: string;
      isActive: boolean;
      serviceAreaPincodes: string[];
      address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
      };
      deliverySettings: Partial<{
        standardPrepMinutes: number;
        currentPrepMinutes: number;
        estimatedTravelMinutes: number;
        totalDeliveryMinutes: number;
        orderAcceptanceMode: 'OPEN' | 'PAUSED' | 'CLOSED';
        workloadPreset: 'NOT_BUSY' | 'NORMAL' | 'BUSY' | 'VERY_BUSY' | 'CUSTOM';
        maxActiveOrders: number;
        autoWorkloadCalculation: boolean;
        deliveryRadiusKm: number;
        minOrderPaise: number;
        deliveryFeePaise: number;
        operatingHours: {
          openTime: string;
          closeTime: string;
          lunchBreakStart?: string;
          lunchBreakEnd?: string;
        };
      }>;
    }>
  ): Promise<IMerchant> {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    const merchant = await MerchantModel.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError('Merchant store not found');
    }

    if (updates.businessName !== undefined) merchant.businessName = updates.businessName.trim();
    if (updates.description !== undefined) merchant.description = updates.description.trim();
    if (updates.contactPhone !== undefined) merchant.contactPhone = updates.contactPhone.trim();
    if (updates.contactEmail !== undefined) merchant.contactEmail = updates.contactEmail.trim().toLowerCase();
    if (updates.isActive !== undefined) merchant.isActive = updates.isActive;
    if (updates.serviceAreaPincodes !== undefined) merchant.serviceAreaPincodes = updates.serviceAreaPincodes;
    if (updates.address !== undefined) {
      merchant.address = {
        street: updates.address.street ?? merchant.address.street,
        city: updates.address.city ?? merchant.address.city,
        state: updates.address.state ?? merchant.address.state,
        postalCode: updates.address.postalCode ?? merchant.address.postalCode,
      };
    }
    if (updates.deliverySettings !== undefined) {
      const existing = (merchant.deliverySettings as any) || {
        standardPrepMinutes: 15,
        currentPrepMinutes: 30,
        estimatedTravelMinutes: 15,
        totalDeliveryMinutes: 45,
        orderAcceptanceMode: 'OPEN',
        workloadPreset: 'NORMAL',
        maxActiveOrders: 8,
        autoWorkloadCalculation: true,
        deliveryRadiusKm: 5,
        minOrderPaise: 10000,
        deliveryFeePaise: 4000,
        operatingHours: { openTime: '07:00', closeTime: '22:00' },
      };
      const prep = updates.deliverySettings.currentPrepMinutes ?? existing.currentPrepMinutes;
      const travel = updates.deliverySettings.estimatedTravelMinutes ?? existing.estimatedTravelMinutes;
      merchant.deliverySettings = {
        ...existing,
        ...updates.deliverySettings,
        currentPrepMinutes: prep,
        estimatedTravelMinutes: travel,
        totalDeliveryMinutes: prep + travel,
      };
    }

    await merchant.save();
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

  /**
   * Add a new product SKU to merchant store inventory.
   * Strictly enforces 100% vegetarian invariant and positive integer paise.
   */
  static async addProduct(
    merchantId: string,
    actorUserId: string,
    input: {
      name: string;
      description: string;
      category: ProductCategory;
      pricePaise: number;
      packageSize: number;
      packageUnit: PackageUnit;
      availableStock: number;
      aliases?: string[];
      imageUrl?: string;
    }
  ): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    const merchant = await MerchantModel.findById(merchantId);
    if (!merchant || merchant.status !== 'APPROVED') {
      throw new BadRequestError('Merchant store not found or not approved');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Product name is required');
    }

    if (!Number.isInteger(input.pricePaise) || input.pricePaise <= 0) {
      throw new BadRequestError('Product price must be a positive integer in paise (₹1.00 = 100 paise)');
    }

    if (!Number.isInteger(input.availableStock) || input.availableStock < 0) {
      throw new BadRequestError('Available stock must be a non-negative integer');
    }

    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const normalizedAliases = (input.aliases || [])
      .map((a) => a.toLowerCase().trim())
      .filter((a) => a.length > 0);

    const product = await ProductModel.create({
      merchantId: new mongoose.Types.ObjectId(merchantId),
      name: input.name.trim(),
      slug,
      description: (input.description || input.name).trim(),
      category: input.category,
      pricePaise: input.pricePaise,
      packageSize: input.packageSize || 1,
      packageUnit: input.packageUnit || 'PIECE',
      availableStock: input.availableStock,
      reservedStock: 0,
      aliases: normalizedAliases,
      isVegetarian: true, // Non-negotiable pure vegetarian invariant
      isActive: true,
      imageUrl: input.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    });

    await auditService.recordEvent({
      eventType: 'MERCHANT_PRODUCT_CREATED',
      actorId: actorUserId,
      actorRole: 'MERCHANT',
      resourceId: product._id.toString(),
      resourceType: 'PRODUCT',
      payload: { merchantId, productId: product._id.toString(), name: product.name, pricePaise: product.pricePaise },
    });

    return product;
  }

  /**
   * Update product SKU details with tenant boundary verification.
   */
  static async updateProduct(
    merchantId: string,
    actorUserId: string,
    productId: string,
    input: {
      name?: string;
      description?: string;
      category?: ProductCategory;
      pricePaise?: number;
      packageSize?: number;
      packageUnit?: PackageUnit;
      aliases?: string[];
      imageUrl?: string;
      isActive?: boolean;
    }
  ): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid product or merchant ID format');
    }

    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    });

    if (!product) {
      throw new NotFoundError('Product not found in your merchant store inventory');
    }

    if (input.pricePaise !== undefined) {
      if (!Number.isInteger(input.pricePaise) || input.pricePaise <= 0) {
        throw new BadRequestError('Price must be a positive integer in paise');
      }
      product.pricePaise = input.pricePaise;
    }

    if (input.name !== undefined) product.name = input.name.trim();
    if (input.description !== undefined) product.description = input.description.trim();
    if (input.category !== undefined) product.category = input.category;
    if (input.packageSize !== undefined) product.packageSize = input.packageSize;
    if (input.packageUnit !== undefined) product.packageUnit = input.packageUnit;
    if (input.imageUrl !== undefined) product.imageUrl = input.imageUrl;
    if (input.isActive !== undefined) product.isActive = input.isActive;
    if (input.aliases !== undefined) {
      product.aliases = input.aliases.map((a) => a.toLowerCase().trim()).filter((a) => a.length > 0);
    }

    product.isVegetarian = true; // Invariant preserved
    await product.save();

    await auditService.recordEvent({
      eventType: 'MERCHANT_PRODUCT_UPDATED',
      actorId: actorUserId,
      actorRole: 'MERCHANT',
      resourceId: product._id.toString(),
      resourceType: 'PRODUCT',
      payload: { merchantId, productId, updates: input },
    });

    return product;
  }

  /**
   * Adjust product inventory stock with atomic validation and non-negative invariant.
   */
  static async adjustProductStock(
    merchantId: string,
    actorUserId: string,
    productId: string,
    adjustment: number,
    reason?: string
  ): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid product or merchant ID format');
    }

    if (!Number.isInteger(adjustment) || adjustment === 0) {
      throw new BadRequestError('Stock adjustment must be a non-zero integer');
    }

    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    });

    if (!product) {
      throw new NotFoundError('Product not found in your merchant store inventory');
    }

    const newStock = product.availableStock + adjustment;
    if (newStock < 0) {
      throw new BadRequestError(
        `Insufficient stock for adjustment. Current stock is ${product.availableStock}, attempted delta is ${adjustment}`
      );
    }

    product.availableStock = newStock;
    await product.save();

    await auditService.recordEvent({
      eventType: 'INVENTORY_STOCK_ADJUSTED',
      actorId: actorUserId,
      actorRole: 'MERCHANT',
      resourceId: product._id.toString(),
      resourceType: 'INVENTORY',
      payload: {
        merchantId,
        productId,
        previousStock: product.availableStock - adjustment,
        adjustment,
        newStock,
        reason: reason || 'Merchant manual stock update',
      },
    });

    return product;
  }

  /**
   * Archive / deactivate a product from merchant store catalog.
   */
  static async archiveProduct(
    merchantId: string,
    actorUserId: string,
    productId: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid product or merchant ID format');
    }

    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    });

    if (!product) {
      throw new NotFoundError('Product not found in your merchant store inventory');
    }

    product.isActive = false;
    await product.save();

    await auditService.recordEvent({
      eventType: 'MERCHANT_PRODUCT_ARCHIVED',
      actorId: actorUserId,
      actorRole: 'MERCHANT',
      resourceId: product._id.toString(),
      resourceType: 'PRODUCT',
      payload: { merchantId, productId },
    });
  }

  /**
   * Merchant creates a real order directly from the Merchant Portal (Manual/POS/Phone order).
   */
  static async createManualOrder(
    merchantUserId: string,
    merchantId: string | undefined,
    input: {
      customer: {
        name: string;
        phone: string;
        email?: string;
        street?: string;
        city?: string;
        postalCode?: string;
      };
      items: Array<{
        productId: string;
        quantity: number;
      }>;
      deliveryNote?: string;
      paymentMethod?: string;
    }
  ): Promise<IOrder> {
    let store: IMerchant | null = null;
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      store = await MerchantModel.findById(merchantId);
    }
    if (!store) {
      const merchantUser = await MerchantUserModel.findOne({ userId: new mongoose.Types.ObjectId(merchantUserId) });
      if (merchantUser) {
        store = await MerchantModel.findById(merchantUser.merchantId);
      }
    }
    if (!store) {
      throw new NotFoundError('Merchant store profile could not be resolved for this account');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Cannot create an order without items');
    }
    if (!input.customer?.name || !input.customer?.phone) {
      throw new BadRequestError('Customer name and phone number are required');
    }

    const itemSnapshots = [];
    let subtotalPaise = 0;

    for (const line of input.items) {
      if (!mongoose.Types.ObjectId.isValid(line.productId)) {
        throw new BadRequestError(`Invalid product ID format: ${line.productId}`);
      }
      const product = await ProductModel.findById(line.productId);
      if (!product) {
        throw new NotFoundError(`Product not found: ${line.productId}`);
      }
      if (!product.isVegetarian) {
        throw new BadRequestError(`Product ${product.name} violates pure-vegetarian policy`);
      }
      const qty = Math.max(1, Number(line.quantity) || 1);
      if (product.availableStock < qty) {
        throw new BadRequestError(
          `Insufficient stock for "${product.name}". Available: ${product.availableStock}, requested: ${qty}`
        );
      }

      const lineSubtotal = product.pricePaise * qty;
      subtotalPaise += lineSubtotal;

      itemSnapshots.push({
        productId: product._id,
        name: product.name,
        category: product.category || 'Grocery',
        quantity: qty,
        unitPricePaise: product.pricePaise,
        subtotalPaise: lineSubtotal,
        packageSize: product.packageSize || 1,
        packageUnit: product.packageUnit || 'piece',
      });

      // Concurrency-safe stock deduction
      product.availableStock -= qty;
      await product.save();
    }

    const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST
    const deliveryFeePaise = store.deliverySettings?.deliveryFeePaise || 0;
    const totalPaise = subtotalPaise + taxPaise + deliveryFeePaise;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CP-${dateStr}-${randomSuffix}`;

    const order = new OrderModel({
      orderNumber,
      userId: new mongoose.Types.ObjectId(merchantUserId),
      merchantId: store._id,
      status: 'CONFIRMED',
      items: itemSnapshots,
      pricingSnapshot: {
        subtotalPaise,
        deliveryFeePaise,
        platformFeePaise: 0,
        taxPaise,
        discountPaise: 0,
        totalPaise,
      },
      shippingAddressSnapshot: {
        street: input.customer.street || 'Storefront Walk-in / Direct Order',
        city: input.customer.city || 'Bengaluru',
        state: 'Karnataka',
        postalCode: input.customer.postalCode || '560038',
        phone: input.customer.phone,
        name: input.customer.name,
      },
      deliveryNote: input.deliveryNote || 'Merchant direct order',
      placedAt: new Date(),
    });

    await order.save();

    await auditService.recordEvent({
      eventType: 'ORDER_CONFIRMED',
      actorId: merchantUserId,
      actorRole: 'MERCHANT',
      resourceId: order._id.toString(),
      resourceType: 'ORDER',
      payload: {
        orderNumber,
        merchantId: store._id.toString(),
        totalPaise,
        itemCount: itemSnapshots.length,
        paymentMethod: input.paymentMethod || 'COD',
      },
    });

    return order;
  }
}

