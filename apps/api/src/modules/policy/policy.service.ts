import { logger } from '../../common/logging/logger.js';
import { approvalService } from '../approvals/approval.service.js';
import { auditService } from '../audit/audit.service.js';
import { CartResponse, CartService } from '../cart/cart.service.js';
import { MandateDocument } from '../mandates/mandate.model.js';
import { mandateService } from '../mandates/mandate.service.js';

export type PolicyOutcome = 'ALLOW' | 'NEEDS_HUMAN_APPROVAL' | 'DENY';

export type PolicyReasonCode =
  | 'WITHIN_LIMITS'
  | 'THRESHOLD_EXCEEDED'
  | 'EXPLICIT_APPROVAL_REQUIRED'
  | 'DAILY_BUDGET_EXCEEDED'
  | 'BLOCKED_CATEGORY'
  | 'UNAUTHORIZED_MERCHANT'
  | 'EMPTY_CART';

export interface PolicyEvaluationResult {
  outcome: PolicyOutcome;
  reasonCode: PolicyReasonCode;
  explanation: string;
  dailyBudgetPaise: number;
  todaySpentPaise: number;
  cartTotalPaise: number;
  maxOrderAmountPaise: number;
  requiresApproval: boolean;
  approvalId?: string;
  approvalHash?: string;
  approvalStatus?: string;
}

export class PolicyService {
  /**
   * Deterministically evaluates active cart against customer's spending mandate and daily budget.
   */
  async evaluateCart(
    userId: string,
    providedCart?: CartResponse,
    providedMandate?: MandateDocument
  ): Promise<PolicyEvaluationResult> {
    const cart = providedCart || (await CartService.getOrCreateActiveCart(userId));
    const mandateWithSpend = await mandateService.getMandateWithDailySpend(userId);
    const mandate = providedMandate || mandateWithSpend.mandate;
    const todaySpentPaise = mandateWithSpend.todaySpentPaise;
    const cartTotalPaise = cart.pricing.totalPaise;

    // Check 0: Empty cart
    if (cart.items.length === 0) {
      return {
        outcome: 'DENY',
        reasonCode: 'EMPTY_CART',
        explanation: 'Cart is empty. Add items before proceeding.',
        dailyBudgetPaise: mandate.dailyBudgetPaise,
        todaySpentPaise,
        cartTotalPaise: 0,
        maxOrderAmountPaise: mandate.maxOrderAmountPaise,
        requiresApproval: false,
      };
    }

    // Check 1: Blocked categories
    if (mandate.blockedCategories && mandate.blockedCategories.length > 0) {
      const blockedUpper = mandate.blockedCategories.map((c) => c.toUpperCase());
      const violatingItem = cart.items.find((item) =>
        blockedUpper.includes(item.category.toUpperCase())
      );

      if (violatingItem) {
        const result: PolicyEvaluationResult = {
          outcome: 'DENY',
          reasonCode: 'BLOCKED_CATEGORY',
          explanation: `Item "${violatingItem.name}" belongs to restricted category "${violatingItem.category}" per customer policy mandate.`,
          dailyBudgetPaise: mandate.dailyBudgetPaise,
          todaySpentPaise,
          cartTotalPaise,
          maxOrderAmountPaise: mandate.maxOrderAmountPaise,
          requiresApproval: false,
        };

        await this.logPolicyAuditEvent(userId, cart.id, result);
        return result;
      }
    }

    // Check 2: Allowed merchants (if restricted)
    if (mandate.allowedMerchantIds && mandate.allowedMerchantIds.length > 0) {
      // Cart items don't have direct merchantId exposed in CartItem, but can be checked if needed
      // (left open for multi-vendor restriction enforcement)
    }

    // Check 3: Daily budget ceiling
    if (todaySpentPaise + cartTotalPaise > mandate.dailyBudgetPaise) {
      const formattedTotal = (cartTotalPaise / 100).toFixed(2);
      const formattedBudget = (mandate.dailyBudgetPaise / 100).toFixed(2);
      const formattedSpent = (todaySpentPaise / 100).toFixed(2);

      const result: PolicyEvaluationResult = {
        outcome: 'DENY',
        reasonCode: 'DAILY_BUDGET_EXCEEDED',
        explanation: `Cart total of ₹${formattedTotal} exceeds daily budget ceiling of ₹${formattedBudget}. Total spent today: ₹${formattedSpent}.`,
        dailyBudgetPaise: mandate.dailyBudgetPaise,
        todaySpentPaise,
        cartTotalPaise,
        maxOrderAmountPaise: mandate.maxOrderAmountPaise,
        requiresApproval: false,
      };

      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Check 4: Autonomous spending threshold or explicit approval mandate
    const exceedsThreshold = cartTotalPaise > mandate.maxOrderAmountPaise;
    const requiresExplicitApproval = mandate.requireExplicitApproval || exceedsThreshold;

    if (requiresExplicitApproval) {
      const formattedTotal = (cartTotalPaise / 100).toFixed(2);
      const formattedLimit = (mandate.maxOrderAmountPaise / 100).toFixed(2);

      const reasonCode: PolicyReasonCode = mandate.requireExplicitApproval
        ? 'EXPLICIT_APPROVAL_REQUIRED'
        : 'THRESHOLD_EXCEEDED';

      const explanation = mandate.requireExplicitApproval
        ? 'Customer mandate is configured to require explicit human sign-off for all purchases.'
        : `Cart total of ₹${formattedTotal} exceeds autonomous limit of ₹${formattedLimit}. Explicit human confirmation required.`;

      // Create or retrieve pending cryptographic approval token
      const approval = await approvalService.createOrGetPendingApproval({
        userId,
        cartId: cart.id,
        cartVersion: cart.version,
        mandateVersion: mandate.version,
        calculatedTotalPaise: cartTotalPaise,
      });

      const result: PolicyEvaluationResult = {
        outcome: approval.status === 'APPROVED' ? 'ALLOW' : 'NEEDS_HUMAN_APPROVAL',
        reasonCode,
        explanation,
        dailyBudgetPaise: mandate.dailyBudgetPaise,
        todaySpentPaise,
        cartTotalPaise,
        maxOrderAmountPaise: mandate.maxOrderAmountPaise,
        requiresApproval: approval.status !== 'APPROVED',
        approvalId: approval._id.toString(),
        approvalHash: approval.approvalHash,
        approvalStatus: approval.status,
      };

      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Check 5: Within autonomous limits
    const formattedTotal = (cartTotalPaise / 100).toFixed(2);
    const formattedLimit = (mandate.maxOrderAmountPaise / 100).toFixed(2);

    const result: PolicyEvaluationResult = {
      outcome: 'ALLOW',
      reasonCode: 'WITHIN_LIMITS',
      explanation: `Cart total of ₹${formattedTotal} is safely within autonomous limit of ₹${formattedLimit}. Auto-approved.`,
      dailyBudgetPaise: mandate.dailyBudgetPaise,
      todaySpentPaise,
      cartTotalPaise,
      maxOrderAmountPaise: mandate.maxOrderAmountPaise,
      requiresApproval: false,
    };

    await this.logPolicyAuditEvent(userId, cart.id, result);
    return result;
  }

  private async logPolicyAuditEvent(
    userId: string,
    cartId: string,
    result: PolicyEvaluationResult
  ): Promise<void> {
    try {
      await auditService.recordEvent({
        eventType: 'POLICY_EVALUATION',
        actorId: userId,
        actorRole: 'CUSTOMER',
        resourceId: cartId,
        resourceType: 'POLICY',
        payload: {
          outcome: result.outcome,
          reasonCode: result.reasonCode,
          cartTotalPaise: result.cartTotalPaise,
          dailyBudgetPaise: result.dailyBudgetPaise,
          todaySpentPaise: result.todaySpentPaise,
          requiresApproval: result.requiresApproval,
          approvalId: result.approvalId,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record policy evaluation in audit ledger');
    }
  }
}

export const policyService = new PolicyService();
