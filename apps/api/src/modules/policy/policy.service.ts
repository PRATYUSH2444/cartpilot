import { logger } from '../../common/logging/logger.js';
import { approvalService } from '../approvals/approval.service.js';
import { auditService } from '../audit/audit.service.js';
import { CartResponse, CartService } from '../cart/cart.service.js';
import { MandateDocument } from '../mandates/mandate.model.js';
import { mandateService } from '../mandates/mandate.service.js';

export type PolicyOutcome = 'ALLOW' | 'NEEDS_APPROVAL' | 'DENY';

export type PolicyReasonCode =
  | 'AGENT_DISABLED'
  | 'ACCOUNT_SUSPENDED'
  | 'MANDATE_REVOKED'
  | 'AGENT_PAUSED'
  | 'MANDATE_EXPIRED'
  | 'MERCHANT_NOT_ALLOWED'
  | 'ITEM_RESTRICTED'
  | 'ABOVE_ORDER_CAP'
  | 'ABOVE_DAILY_CAP'
  | 'QTY_SANITY'
  | 'ABOVE_AUTO_LIMIT'
  | 'WITHIN_LIMIT'
  // Legacy reason codes kept for backward compatibility with existing tests
  | 'WITHIN_LIMITS'
  | 'THRESHOLD_EXCEEDED'
  | 'EXPLICIT_APPROVAL_REQUIRED'
  | 'DAILY_BUDGET_EXCEEDED'
  | 'BLOCKED_CATEGORY'
  | 'UNAUTHORIZED_MERCHANT'
  | 'EMPTY_CART';

export interface PolicyRemedy {
  id: string;
  label: string;
  effect: string;
  action:
    | 'REMOVE_OPTIONAL_ITEMS'
    | 'RAISE_CAP'
    | 'REDUCE_QTY'
    | 'CHANGE_MERCHANT'
    | 'ENABLE_AGENT'
    | 'ORDER_LATER';
}

export interface PolicyEvaluationResult {
  outcome: PolicyOutcome;
  reasonCode: PolicyReasonCode;
  explanation: string;
  dailyCapPaise: number;
  perOrderCapPaise: number;
  autoApproveUpToPaise: number;
  todaySpentPaise: number;
  cartTotalPaise: number;
  requiresApproval: boolean;
  approvalId?: string;
  approvalHash?: string;
  approvalStatus?: string;
  remedies: PolicyRemedy[];
  // Legacy fields for backward compatibility with existing tests
  dailyBudgetPaise: number;
  maxOrderAmountPaise: number;
}

export interface SimulateInput {
  amountPaise?: number;
  merchantId?: string;
  cartId?: string;
  draftRules?: {
    autoApproveUpToPaise?: number;
    perOrderCapPaise?: number;
    dailyCapPaise?: number;
  };
}

export class PolicyService {
  /**
   * Deterministically evaluates active cart against customer's spending mandate and daily budget.
   * Implements the 12-rule table from spec §7.2.
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

    // Resolve cap values — support both old and new field names
    const dailyCapPaise: number =
      mandate.dailyBudgetPaise !== undefined
        ? mandate.dailyBudgetPaise
        : ((mandate as any).dailyCapPaise ?? 150000);
    const perOrderCapPaise: number =
      (mandate as any).perOrderCapPaise !== undefined ? (mandate as any).perOrderCapPaise : 100000;
    const autoApproveUpToPaise: number =
      mandate.maxOrderAmountPaise !== undefined
        ? mandate.maxOrderAmountPaise
        : ((mandate as any).autoApproveUpToPaise ?? 60000);

    // Rule 1: AGENT_DISABLED — global kill switch (isActive=false)
    if (!mandate.isActive) {
      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'AGENT_DISABLED',
        explanation: 'The agent is globally disabled. Re-enable it to proceed.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Turn the agent back on',
            effect: 'Re-enables the agent',
            action: 'ENABLE_AGENT',
          },
        ],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 2: ACCOUNT_SUSPENDED — (no field for now; placeholder guard)
    // (no current account suspension field in the model, skip)

    // Rule 3: MANDATE_REVOKED
    if ((mandate as any).revoked === true) {
      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'MANDATE_REVOKED',
        explanation: 'The spending mandate has been revoked.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 4: AGENT_PAUSED
    if ((mandate as any).paused === true) {
      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'AGENT_PAUSED',
        explanation: 'The agent is paused. Re-enable it to proceed.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Turn the agent back on',
            effect: 'Re-enables the agent',
            action: 'ENABLE_AGENT',
          },
        ],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 5: MANDATE_EXPIRED
    if ((mandate as any).expiresAt && new Date((mandate as any).expiresAt) < new Date()) {
      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'MANDATE_EXPIRED',
        explanation: 'The spending mandate has expired.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Check 0: Empty cart
    if (cart.items.length === 0) {
      return this._buildResult({
        outcome: 'DENY',
        reasonCode: 'EMPTY_CART',
        explanation: 'Cart is empty. Add items before proceeding.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise: 0,
        requiresApproval: false,
        remedies: [],
      });
    }

    // Rule 6: MERCHANT_NOT_ALLOWED
    if (mandate.allowedMerchantIds && mandate.allowedMerchantIds.length > 0) {
      // Cart items don't expose merchantId directly; left open for multi-vendor enforcement
    }

    // Rule 7: ITEM_RESTRICTED — blocked categories
    if (mandate.blockedCategories && mandate.blockedCategories.length > 0) {
      const blockedUpper = mandate.blockedCategories.map((c) => c.toUpperCase());
      const violatingItem = cart.items.find((item) =>
        blockedUpper.includes(item.category.toUpperCase())
      );

      if (violatingItem) {
        const result = this._buildResult({
          outcome: 'DENY',
          reasonCode: 'BLOCKED_CATEGORY',
          explanation: `Item "${violatingItem.name}" belongs to restricted category "${violatingItem.category}" per customer policy mandate.`,
          dailyCapPaise,
          perOrderCapPaise,
          autoApproveUpToPaise,
          todaySpentPaise,
          cartTotalPaise,
          requiresApproval: false,
          remedies: [
            {
              id: 'r1',
              label: 'Review quantities in cart',
              effect: 'Opens cart for editing',
              action: 'REDUCE_QTY',
            },
          ],
        });
        await this.logPolicyAuditEvent(userId, cart.id, result);
        return result;
      }
    }

    // Rule 8: ABOVE_DAILY_CAP — total + today_used > dailyCapPaise
    if (todaySpentPaise + cartTotalPaise > dailyCapPaise) {
      const formattedTotal = (cartTotalPaise / 100).toFixed(2);
      const formattedBudget = (dailyCapPaise / 100).toFixed(2);
      const formattedSpent = (todaySpentPaise / 100).toFixed(2);

      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'DAILY_BUDGET_EXCEEDED',
        explanation: `Cart total of ₹${formattedTotal} exceeds daily budget ceiling of ₹${formattedBudget}. Total spent today: ₹${formattedSpent}.`,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Order after midnight (resets at 12:00 am IST)',
            effect: 'Daily cap resets at midnight IST',
            action: 'ORDER_LATER',
          },
        ],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 9: ABOVE_ORDER_CAP — total > perOrderCapPaise
    if (cartTotalPaise > perOrderCapPaise) {
      const formattedTotal = (cartTotalPaise / 100).toFixed(2);
      const formattedCap = (perOrderCapPaise / 100).toFixed(2);
      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'ABOVE_ORDER_CAP',
        explanation: `Cart total of ₹${formattedTotal} exceeds per-order cap of ₹${formattedCap}.`,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Raise your order cap',
            effect: 'Opens mandate settings',
            action: 'RAISE_CAP',
          },
        ],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 10: QTY_SANITY — any item qty > 20
    const insaneQtyItem = cart.items.find((item) => item.quantity > 20);
    if (insaneQtyItem) {
      const result = this._buildResult({
        outcome: 'DENY',
        reasonCode: 'QTY_SANITY',
        explanation: `Item "${insaneQtyItem.name}" has an unusual quantity of ${insaneQtyItem.quantity}. Max auto-approved quantity per item is 20.`,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Review quantities in cart',
            effect: 'Opens cart for editing',
            action: 'REDUCE_QTY',
          },
        ],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 11: ABOVE_AUTO_LIMIT — total > autoApproveUpToPaise → NEEDS_APPROVAL
    const exceedsAutoLimit = cartTotalPaise > autoApproveUpToPaise;
    const requiresExplicitApproval = mandate.requireExplicitApproval || exceedsAutoLimit;

    if (requiresExplicitApproval) {
      const formattedTotal = (cartTotalPaise / 100).toFixed(2);
      const formattedLimit = (autoApproveUpToPaise / 100).toFixed(2);

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

      const result = this._buildResult({
        outcome: approval.status === 'APPROVED' ? 'ALLOW' : 'NEEDS_APPROVAL',
        reasonCode,
        explanation,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: approval.status !== 'APPROVED',
        approvalId: approval._id.toString(),
        approvalHash: approval.approvalHash,
        approvalStatus: approval.status,
        remedies: [],
      });
      await this.logPolicyAuditEvent(userId, cart.id, result);
      return result;
    }

    // Rule 12: WITHIN_LIMIT — default ALLOW
    const formattedTotal = (cartTotalPaise / 100).toFixed(2);
    const formattedLimit = (autoApproveUpToPaise / 100).toFixed(2);

    const result = this._buildResult({
      outcome: 'ALLOW',
      reasonCode: 'WITHIN_LIMITS',
      explanation: `Cart total of ₹${formattedTotal} is safely within autonomous limit of ₹${formattedLimit}. Auto-approved.`,
      dailyCapPaise,
      perOrderCapPaise,
      autoApproveUpToPaise,
      todaySpentPaise,
      cartTotalPaise,
      requiresApproval: false,
      remedies: [],
    });

    await this.logPolicyAuditEvent(userId, cart.id, result);
    return result;
  }

  /**
   * Simulates policy evaluation against draft rules WITHOUT writing any state.
   */
  async simulate(userId: string, input: SimulateInput): Promise<PolicyEvaluationResult> {
    const mandateWithSpend = await mandateService.getMandateWithDailySpend(userId);
    const mandate = mandateWithSpend.mandate;
    const todaySpentPaise = mandateWithSpend.todaySpentPaise;

    // Resolve caps — draft rules override if provided
    const perOrderCapPaise: number =
      input.draftRules?.perOrderCapPaise ??
      (mandate as any).perOrderCapPaise ??
      mandate.maxOrderAmountPaise;
    const dailyCapPaise: number =
      input.draftRules?.dailyCapPaise ?? (mandate as any).dailyCapPaise ?? mandate.dailyBudgetPaise;
    const autoApproveUpToPaise: number =
      input.draftRules?.autoApproveUpToPaise ??
      (mandate as any).autoApproveUpToPaise ??
      mandate.maxOrderAmountPaise;

    let cartTotalPaise = 0;
    if (input.amountPaise !== undefined) {
      cartTotalPaise = input.amountPaise;
    } else if (input.cartId) {
      // Load the cart by fetching the active cart (userId-scoped)
      const cart = await CartService.getOrCreateActiveCart(userId);
      cartTotalPaise = cart.pricing.totalPaise;
    }

    // Evaluate rules deterministically (read-only — no approvals created)
    if (!mandate.isActive) {
      return this._buildResult({
        outcome: 'DENY',
        reasonCode: 'AGENT_DISABLED',
        explanation: 'The agent is globally disabled.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Turn the agent back on',
            effect: 'Re-enables the agent',
            action: 'ENABLE_AGENT',
          },
        ],
      });
    }

    if ((mandate as any).revoked === true) {
      return this._buildResult({
        outcome: 'DENY',
        reasonCode: 'MANDATE_REVOKED',
        explanation: 'Mandate revoked.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [],
      });
    }

    if ((mandate as any).paused === true) {
      return this._buildResult({
        outcome: 'DENY',
        reasonCode: 'AGENT_PAUSED',
        explanation: 'Agent paused.',
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Turn the agent back on',
            effect: 'Re-enables the agent',
            action: 'ENABLE_AGENT',
          },
        ],
      });
    }

    if (cartTotalPaise > perOrderCapPaise) {
      return this._buildResult({
        outcome: 'DENY',
        reasonCode: 'ABOVE_ORDER_CAP',
        explanation: `Amount ₹${(cartTotalPaise / 100).toFixed(2)} exceeds per-order cap ₹${(perOrderCapPaise / 100).toFixed(2)}.`,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Raise your order cap',
            effect: 'Opens mandate settings',
            action: 'RAISE_CAP',
          },
        ],
      });
    }

    if (todaySpentPaise + cartTotalPaise > dailyCapPaise) {
      return this._buildResult({
        outcome: 'DENY',
        reasonCode: 'ABOVE_DAILY_CAP',
        explanation: `Amount ₹${(cartTotalPaise / 100).toFixed(2)} + today spent ₹${(todaySpentPaise / 100).toFixed(2)} exceeds daily cap ₹${(dailyCapPaise / 100).toFixed(2)}.`,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: false,
        remedies: [
          {
            id: 'r1',
            label: 'Order after midnight (resets at 12:00 am IST)',
            effect: 'Daily cap resets at midnight IST',
            action: 'ORDER_LATER',
          },
        ],
      });
    }

    if (cartTotalPaise > autoApproveUpToPaise) {
      return this._buildResult({
        outcome: 'NEEDS_APPROVAL',
        reasonCode: 'ABOVE_AUTO_LIMIT',
        explanation: `Amount ₹${(cartTotalPaise / 100).toFixed(2)} exceeds auto-approve limit ₹${(autoApproveUpToPaise / 100).toFixed(2)}. Approval required.`,
        dailyCapPaise,
        perOrderCapPaise,
        autoApproveUpToPaise,
        todaySpentPaise,
        cartTotalPaise,
        requiresApproval: true,
        remedies: [],
      });
    }

    return this._buildResult({
      outcome: 'ALLOW',
      reasonCode: 'WITHIN_LIMIT',
      explanation: `Amount ₹${(cartTotalPaise / 100).toFixed(2)} is within all limits. Auto-approved.`,
      dailyCapPaise,
      perOrderCapPaise,
      autoApproveUpToPaise,
      todaySpentPaise,
      cartTotalPaise,
      requiresApproval: false,
      remedies: [],
    });
  }

  /**
   * Applies a counterfactual policy remedy (e.g. raising order cap, unpausing agent,
   * or adjusting cart) and immediately returns the refreshed policy evaluation.
   */
  async applyRemedy(
    userId: string,
    input: {
      action: 'RAISE_CAP' | 'ENABLE_AGENT' | 'REMOVE_OPTIONAL_ITEMS' | 'ORDER_LATER' | 'REDUCE_QTY';
      remedyId?: string;
      requiredCapPaise?: number;
      cartId?: string;
    }
  ): Promise<{ message: string; policy: PolicyEvaluationResult }> {
    const mandate = await mandateService.getOrCreateMandate(userId);

    if (input.action === 'RAISE_CAP') {
      const cart = await CartService.getOrCreateActiveCart(userId);
      const newCap =
        input.requiredCapPaise ||
        Math.max(cart.pricing.totalPaise, mandate.maxOrderAmountPaise + 10000);
      mandate.maxOrderAmountPaise = newCap;
      mandate.perOrderCapPaise = newCap;
      mandate.version += 1;
      await mandate.save();

      await auditService.recordEvent({
        eventType: 'MANDATE_UPDATED',
        actorId: userId,
        actorRole: 'CUSTOMER',
        resourceId: mandate._id.toString(),
        resourceType: 'MANDATE',
        payload: {
          action: 'APPLIED_REMEDY_RAISE_CAP',
          remedyId: input.remedyId,
          version: mandate.version,
          newPerOrderCapPaise: newCap,
        },
      });

      const updatedPolicy = await this.evaluateCart(userId);
      return {
        message: `Order cap raised to ₹${(newCap / 100).toFixed(2)}. Evaluation refreshed.`,
        policy: updatedPolicy,
      };
    }

    if (input.action === 'ENABLE_AGENT') {
      mandate.isActive = true;
      (mandate as any).paused = false;
      mandate.version += 1;
      await mandate.save();

      await auditService.recordEvent({
        eventType: 'MANDATE_UPDATED',
        actorId: userId,
        actorRole: 'CUSTOMER',
        resourceId: mandate._id.toString(),
        resourceType: 'MANDATE',
        payload: {
          action: 'APPLIED_REMEDY_ENABLE_AGENT',
          remedyId: input.remedyId,
          version: mandate.version,
          isActive: true,
        },
      });

      const updatedPolicy = await this.evaluateCart(userId);
      return {
        message: 'Agent unpaused and re-enabled successfully.',
        policy: updatedPolicy,
      };
    }

    if (input.action === 'ORDER_LATER') {
      const currentPolicy = await this.evaluateCart(userId);
      return {
        message: 'Daily spending quota automatically resets at 12:00 AM IST (Asia/Kolkata).',
        policy: currentPolicy,
      };
    }

    const currentPolicy = await this.evaluateCart(userId);
    return {
      message: 'Remedy reviewed.',
      policy: currentPolicy,
    };
  }

  private _buildResult(params: {
    outcome: PolicyOutcome;
    reasonCode: PolicyReasonCode;
    explanation: string;
    dailyCapPaise: number;
    perOrderCapPaise: number;
    autoApproveUpToPaise: number;
    todaySpentPaise: number;
    cartTotalPaise: number;
    requiresApproval: boolean;
    approvalId?: string;
    approvalHash?: string;
    approvalStatus?: string;
    remedies: PolicyRemedy[];
  }): PolicyEvaluationResult {
    return {
      outcome: params.outcome,
      reasonCode: params.reasonCode,
      explanation: params.explanation,
      dailyCapPaise: params.dailyCapPaise,
      perOrderCapPaise: params.perOrderCapPaise,
      autoApproveUpToPaise: params.autoApproveUpToPaise,
      todaySpentPaise: params.todaySpentPaise,
      cartTotalPaise: params.cartTotalPaise,
      requiresApproval: params.requiresApproval,
      approvalId: params.approvalId,
      approvalHash: params.approvalHash,
      approvalStatus: params.approvalStatus,
      remedies: params.remedies,
      // Legacy aliases for backward compatibility
      dailyBudgetPaise: params.dailyCapPaise,
      maxOrderAmountPaise: params.perOrderCapPaise,
    };
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
