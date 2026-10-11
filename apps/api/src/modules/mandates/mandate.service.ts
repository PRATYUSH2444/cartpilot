import mongoose from 'mongoose';
import { auditService } from '../audit/audit.service.js';
import { OrderService } from '../orders/order.service.js';
import { IMandate, MandateDocument, MandateModel } from './mandate.model.js';
import { UpdateMandateInput } from './mandate.schema.js';

export interface MandateWithSpend {
  mandate: IMandate;
  todaySpentPaise: number;
  remainingDailyBudgetPaise: number;
}

export class MandateService {
  /**
   * Retrieves active mandate for user, auto-creating standard defaults if none exists.
   */
  async getOrCreateMandate(userId: string): Promise<MandateDocument> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let mandate = await MandateModel.findOne({ userId: userObjectId });

    if (!mandate) {
      mandate = await MandateModel.create({
        userId: userObjectId,
        version: 1,
        maxOrderAmountPaise: 60000, // ₹600.00
        dailyBudgetPaise: 150000, // ₹1,500.00
        allowedMerchantIds: [],
        blockedCategories: [],
        requireExplicitApproval: false,
        isActive: true,
      });

      await auditService.recordEvent({
        eventType: 'MANDATE_UPDATED',
        actorId: userId,
        actorRole: 'CUSTOMER',
        resourceId: mandate._id.toString(),
        resourceType: 'MANDATE',
        payload: {
          action: 'INITIALIZED_DEFAULT_MANDATE',
          version: mandate.version,
          maxOrderAmountPaise: mandate.maxOrderAmountPaise,
          dailyBudgetPaise: mandate.dailyBudgetPaise,
        },
      });
    }

    return mandate;
  }

  /**
   * Updates user's mandate rules, increments version monotonically, and logs to audit ledger.
   */
  async updateMandate(userId: string, input: UpdateMandateInput): Promise<MandateDocument> {
    const mandate = await this.getOrCreateMandate(userId);

    if (input.maxOrderAmountPaise !== undefined) {
      mandate.maxOrderAmountPaise = input.maxOrderAmountPaise;
    }
    if (input.dailyBudgetPaise !== undefined) {
      mandate.dailyBudgetPaise = input.dailyBudgetPaise;
    }
    if (input.allowedMerchantIds !== undefined) {
      mandate.allowedMerchantIds = input.allowedMerchantIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }
    if (input.blockedCategories !== undefined) {
      mandate.blockedCategories = input.blockedCategories.map((c) => c.toUpperCase());
    }
    if (input.requireExplicitApproval !== undefined) {
      mandate.requireExplicitApproval = input.requireExplicitApproval;
    }
    if (input.isActive !== undefined) {
      mandate.isActive = input.isActive;
    }

    mandate.version += 1;
    await mandate.save();

    await auditService.recordEvent({
      eventType: 'MANDATE_UPDATED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: mandate._id.toString(),
      resourceType: 'MANDATE',
      payload: {
        version: mandate.version,
        maxOrderAmountPaise: mandate.maxOrderAmountPaise,
        dailyBudgetPaise: mandate.dailyBudgetPaise,
        blockedCategories: mandate.blockedCategories,
        requireExplicitApproval: mandate.requireExplicitApproval,
      },
    });

    return mandate;
  }

  /**
   * Retrieves mandate alongside current cumulative daily spending.
   */
  async getMandateWithDailySpend(userId: string): Promise<MandateWithSpend> {
    const mandate = await this.getOrCreateMandate(userId);
    const todaySpentPaise = await OrderService.getDailySpendForUser(userId);
    const remainingDailyBudgetPaise = Math.max(0, mandate.dailyBudgetPaise - todaySpentPaise);

    return {
      mandate,
      todaySpentPaise,
      remainingDailyBudgetPaise,
    };
  }
}

export const mandateService = new MandateService();
