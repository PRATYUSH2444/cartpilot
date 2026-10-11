import mongoose from 'mongoose';
import { AppError, NotFoundError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';
import { auditService, computeSha256 } from '../audit/audit.service.js';
import { CartService } from '../cart/cart.service.js';
import { mandateService } from '../mandates/mandate.service.js';
import { ApprovalDocument, ApprovalModel } from './approval.model.js';

export class ApprovalService {
  /**
   * Generates deterministic SHA-256 approval fingerprint.
   */
  public generateApprovalHash(params: {
    userId: string;
    cartId: string;
    cartVersion: number;
    calculatedTotalPaise: number;
    mandateVersion: number;
  }): string {
    const raw = `${params.userId}:${params.cartId}:${params.cartVersion}:${params.calculatedTotalPaise}:${params.mandateVersion}`;
    return computeSha256(raw);
  }

  /**
   * Finds or creates a cryptographic approval token for an active cart requiring human sign-off.
   */
  async createOrGetPendingApproval(params: {
    userId: string;
    cartId: string;
    cartVersion: number;
    mandateVersion: number;
    calculatedTotalPaise: number;
  }): Promise<ApprovalDocument> {
    const userObjectId = new mongoose.Types.ObjectId(params.userId);
    const cartObjectId = new mongoose.Types.ObjectId(params.cartId);

    const expectedHash = this.generateApprovalHash(params);

    // Look for active existing approval matching this exact fingerprint
    const existing = await ApprovalModel.findOne({
      userId: userObjectId,
      cartId: cartObjectId,
      cartVersion: params.cartVersion,
      mandateVersion: params.mandateVersion,
      calculatedTotalPaise: params.calculatedTotalPaise,
      status: { $in: ['PENDING', 'APPROVED'] },
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      return existing;
    }

    // Invalidate any stale pending approvals for this cart
    await ApprovalModel.updateMany(
      {
        userId: userObjectId,
        cartId: cartObjectId,
        status: 'PENDING',
      },
      {
        $set: { status: 'INVALIDATED' },
      }
    );

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute validity window

    const approval = await ApprovalModel.create({
      userId: userObjectId,
      cartId: cartObjectId,
      cartVersion: params.cartVersion,
      mandateVersion: params.mandateVersion,
      calculatedTotalPaise: params.calculatedTotalPaise,
      approvalHash: expectedHash,
      status: 'PENDING',
      expiresAt,
    });

    await auditService.recordEvent({
      eventType: 'APPROVAL_REQUESTED',
      actorId: params.userId,
      actorRole: 'CUSTOMER',
      resourceId: approval._id.toString(),
      resourceType: 'APPROVAL',
      payload: {
        cartId: params.cartId,
        cartVersion: params.cartVersion,
        mandateVersion: params.mandateVersion,
        calculatedTotalPaise: params.calculatedTotalPaise,
        approvalHash: expectedHash,
        expiresAt: expiresAt.toISOString(),
      },
    });

    logger.info(
      { approvalId: approval._id, cartId: params.cartId, hash: expectedHash.substring(0, 16) },
      'Created pending human approval token'
    );

    return approval;
  }

  /**
   * Retrieves active pending approval for the customer.
   */
  async getPendingApprovalForUser(userId: string): Promise<ApprovalDocument | null> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return ApprovalModel.findOne({
      userId: userObjectId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  /**
   * Customer grants explicit cryptographic sign-off for proposed purchase.
   */
  async approve(userId: string, approvalId: string): Promise<ApprovalDocument> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const approval = await ApprovalModel.findOne({
      _id: new mongoose.Types.ObjectId(approvalId),
      userId: userObjectId,
    });

    if (!approval) {
      throw new NotFoundError('Approval request not found');
    }

    if (approval.status !== 'PENDING') {
      throw new AppError(
        'APPROVAL_NOT_PENDING',
        `Cannot approve request in "${approval.status}" state`,
        400
      );
    }

    if (approval.expiresAt < new Date()) {
      approval.status = 'EXPIRED';
      await approval.save();
      throw new AppError('APPROVAL_EXPIRED', 'Approval token has expired (15-minute TTL)', 400);
    }

    // Re-verify current cart & mandate state has not mutated
    const currentCart = await CartService.getOrCreateActiveCart(userId);
    const currentMandate = await mandateService.getOrCreateMandate(userId);

    const isCartVersionMatch = currentCart.version === approval.cartVersion;
    const isTotalMatch = currentCart.pricing.totalPaise === approval.calculatedTotalPaise;
    const isMandateVersionMatch = currentMandate.version === approval.mandateVersion;

    if (!isCartVersionMatch || !isTotalMatch || !isMandateVersionMatch) {
      approval.status = 'INVALIDATED';
      await approval.save();

      await auditService.recordEvent({
        eventType: 'APPROVAL_INVALIDATED',
        actorId: userId,
        actorRole: 'CUSTOMER',
        resourceId: approval._id.toString(),
        resourceType: 'APPROVAL',
        payload: {
          reason: 'CART_OR_MANDATE_MUTATED_PRIOR_TO_APPROVAL',
          storedCartVersion: approval.cartVersion,
          currentCartVersion: currentCart.version,
          storedTotalPaise: approval.calculatedTotalPaise,
          currentTotalPaise: currentCart.pricing.totalPaise,
        },
      });

      throw new AppError(
        'APPROVAL_INVALIDATED',
        'Cart contents or spending policy modified since approval was issued. Please review and approve the updated total.',
        409
      );
    }

    // Verify hash integrity
    const expectedHash = this.generateApprovalHash({
      userId,
      cartId: approval.cartId.toString(),
      cartVersion: approval.cartVersion,
      calculatedTotalPaise: approval.calculatedTotalPaise,
      mandateVersion: approval.mandateVersion,
    });

    if (approval.approvalHash !== expectedHash) {
      throw new AppError('SECURITY_VIOLATION', 'Cryptographic approval hash mismatch', 403);
    }

    approval.status = 'APPROVED';
    approval.decidedAt = new Date();
    await approval.save();

    await auditService.recordEvent({
      eventType: 'APPROVAL_DECIDED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: approval._id.toString(),
      resourceType: 'APPROVAL',
      payload: {
        decision: 'APPROVED',
        approvalHash: approval.approvalHash,
        cartId: approval.cartId.toString(),
        cartVersion: approval.cartVersion,
        calculatedTotalPaise: approval.calculatedTotalPaise,
      },
    });

    logger.info(
      { approvalId: approval._id, userId },
      'Cryptographic approval successfully granted'
    );

    return approval;
  }

  /**
   * Customer explicitly rejects proposed purchase.
   */
  async reject(userId: string, approvalId: string, reason?: string): Promise<ApprovalDocument> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const approval = await ApprovalModel.findOne({
      _id: new mongoose.Types.ObjectId(approvalId),
      userId: userObjectId,
    });

    if (!approval) {
      throw new NotFoundError('Approval request not found');
    }

    approval.status = 'REJECTED';
    approval.decidedAt = new Date();
    approval.rejectionReason = reason || 'Rejected by customer';
    await approval.save();

    await auditService.recordEvent({
      eventType: 'APPROVAL_DECIDED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: approval._id.toString(),
      resourceType: 'APPROVAL',
      payload: {
        decision: 'REJECTED',
        reason: approval.rejectionReason,
      },
    });

    return approval;
  }

  /**
   * Invalidates any pending or granted approvals for a cart after modification.
   */
  async invalidateApprovalsForCart(cartId: string): Promise<number> {
    const cartObjectId = new mongoose.Types.ObjectId(cartId);
    const result = await ApprovalModel.updateMany(
      {
        cartId: cartObjectId,
        status: { $in: ['PENDING', 'APPROVED'] },
      },
      {
        $set: { status: 'INVALIDATED' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(
        { cartId, count: result.modifiedCount },
        'Invalidated active approvals following cart mutation'
      );
      await auditService.recordEvent({
        eventType: 'APPROVAL_INVALIDATED',
        actorId: 'SYSTEM',
        actorRole: 'SYSTEM',
        resourceId: cartId,
        resourceType: 'APPROVAL',
        payload: {
          reason: 'CART_MUTATION',
          count: result.modifiedCount,
        },
      });
    }

    return result.modifiedCount;
  }

  /**
   * Validates whether an APPROVED token exists for checkout execution.
   */
  async findValidApprovedRecord(params: {
    userId: string;
    cartId: string;
    cartVersion: number;
    mandateVersion: number;
    calculatedTotalPaise: number;
  }): Promise<ApprovalDocument | null> {
    const userObjectId = new mongoose.Types.ObjectId(params.userId);
    const cartObjectId = new mongoose.Types.ObjectId(params.cartId);

    const expectedHash = this.generateApprovalHash(params);

    const approval = await ApprovalModel.findOne({
      userId: userObjectId,
      cartId: cartObjectId,
      cartVersion: params.cartVersion,
      mandateVersion: params.mandateVersion,
      calculatedTotalPaise: params.calculatedTotalPaise,
      approvalHash: expectedHash,
      status: 'APPROVED',
      expiresAt: { $gt: new Date() },
    });

    return approval;
  }
}

export const approvalService = new ApprovalService();
