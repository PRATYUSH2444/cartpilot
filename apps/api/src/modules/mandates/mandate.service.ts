import mongoose from 'mongoose';
import { auditService } from '../audit/audit.service.js';
import { OrderService } from '../orders/order.service.js';
import { IMandate, MandateDocument, MandateModel } from './mandate.model.js';
import { UpdateMandateInput } from './mandate.schema.js';

import { BadRequestError } from '../../common/errors/app-error.js';

export interface MandatePreset {
  key: 'careful' | 'everyday' | 'family';
  name: string;
  description: string;
  autoApproveUpToPaise: number;
  perOrderCapPaise: number;
  dailyCapPaise: number;
  maxOrderAmountPaise: number;
  dailyBudgetPaise: number;
}

export const MANDATE_PRESETS: Record<string, MandatePreset> = {
  careful: {
    key: 'careful',
    name: 'Careful',
    description: 'Conservative limits for single shoppers and small grocery top-ups',
    autoApproveUpToPaise: 30000, // ₹300.00
    perOrderCapPaise: 100000, // ₹1,000.00
    dailyCapPaise: 150000, // ₹1,500.00
    maxOrderAmountPaise: 100000, // ₹1,000.00
    dailyBudgetPaise: 150000, // ₹1,500.00
  },
  everyday: {
    key: 'everyday',
    name: 'Everyday',
    description: 'Balanced spending rules for typical household daily cooking',
    autoApproveUpToPaise: 80000, // ₹800.00
    perOrderCapPaise: 200000, // ₹2,000.00
    dailyCapPaise: 300000, // ₹3,000.00
    maxOrderAmountPaise: 200000, // ₹2,000.00
    dailyBudgetPaise: 300000, // ₹3,000.00
  },
  family: {
    key: 'family',
    name: 'Family week',
    description: 'Generous limits for weekly bulk groceries and family feasts',
    autoApproveUpToPaise: 150000, // ₹1,500.00
    perOrderCapPaise: 400000, // ₹4,000.00
    dailyCapPaise: 500000, // ₹5,000.00
    maxOrderAmountPaise: 400000, // ₹4,000.00
    dailyBudgetPaise: 500000, // ₹5,000.00
  },
};

export interface MandateWithSpend {
  mandate: IMandate;
  todaySpentPaise: number;
  remainingDailyBudgetPaise: number;
  activePresetKey?: string;
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
        maxOrderAmountPaise: 100000, // ₹1,000.00
        autoApproveUpToPaise: 30000, // ₹300.00
        perOrderCapPaise: 100000, // ₹1,000.00
        dailyBudgetPaise: 150000, // ₹1,500.00
        dailyCapPaise: 150000, // ₹1,500.00
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

    if (input.perOrderCapPaise !== undefined) {
      mandate.perOrderCapPaise = input.perOrderCapPaise;
      mandate.maxOrderAmountPaise = input.perOrderCapPaise;
    } else if (input.maxOrderAmountPaise !== undefined) {
      mandate.maxOrderAmountPaise = input.maxOrderAmountPaise;
      mandate.perOrderCapPaise = input.maxOrderAmountPaise;
    }

    if (input.dailyCapPaise !== undefined) {
      mandate.dailyCapPaise = input.dailyCapPaise;
      mandate.dailyBudgetPaise = input.dailyCapPaise;
    } else if (input.dailyBudgetPaise !== undefined) {
      mandate.dailyBudgetPaise = input.dailyBudgetPaise;
      mandate.dailyCapPaise = input.dailyBudgetPaise;
    }

    if (input.autoApproveUpToPaise !== undefined) {
      mandate.autoApproveUpToPaise = input.autoApproveUpToPaise;
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
        perOrderCapPaise: mandate.perOrderCapPaise,
        dailyBudgetPaise: mandate.dailyBudgetPaise,
        dailyCapPaise: mandate.dailyCapPaise,
        autoApproveUpToPaise: mandate.autoApproveUpToPaise,
        blockedCategories: mandate.blockedCategories,
        requireExplicitApproval: mandate.requireExplicitApproval,
      },
    });

    return mandate;
  }

  /**
   * Returns list of configured starter mandate presets.
   */
  getPresets(): { presets: MandatePreset[] } {
    return {
      presets: Object.values(MANDATE_PRESETS),
    };
  }

  /**
   * Applies one of the predefined starter presets (Careful, Everyday, Family week)
   * to user's active mandate, increments version, and records an audit event.
   */
  async applyPreset(userId: string, presetKey: string): Promise<MandateWithSpend> {
    const normalizedKey = presetKey.toLowerCase() === 'family_week' ? 'family' : presetKey.toLowerCase();
    const preset = MANDATE_PRESETS[normalizedKey];
    if (!preset) {
      throw new BadRequestError(
        `Invalid mandate preset: "${presetKey}". Supported presets: careful, everyday, family.`
      );
    }

    const mandate = await this.getOrCreateMandate(userId);
    mandate.maxOrderAmountPaise = preset.perOrderCapPaise;
    mandate.perOrderCapPaise = preset.perOrderCapPaise;
    mandate.dailyBudgetPaise = preset.dailyCapPaise;
    mandate.dailyCapPaise = preset.dailyCapPaise;
    mandate.autoApproveUpToPaise = preset.autoApproveUpToPaise;
    mandate.version += 1;
    await mandate.save();

    await auditService.recordEvent({
      eventType: 'MANDATE_UPDATED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: mandate._id.toString(),
      resourceType: 'MANDATE',
      payload: {
        action: 'APPLIED_STARTER_PRESET',
        presetKey: preset.key,
        presetName: preset.name,
        version: mandate.version,
        autoApproveUpToPaise: preset.autoApproveUpToPaise,
        maxOrderAmountPaise: preset.maxOrderAmountPaise,
        dailyBudgetPaise: preset.dailyBudgetPaise,
      },
    });

    return this.getMandateWithDailySpend(userId);
  }

  /**
   * Retrieves mandate alongside current cumulative daily spending and matching preset key.
   */
  async getMandateWithDailySpend(userId: string): Promise<MandateWithSpend> {
    const mandate = await this.getOrCreateMandate(userId);
    const todaySpentPaise = await OrderService.getDailySpendForUser(userId);
    const remainingDailyBudgetPaise = Math.max(0, mandate.dailyBudgetPaise - todaySpentPaise);

    // Detect active preset if values match
    let activePresetKey = 'custom';
    for (const [k, p] of Object.entries(MANDATE_PRESETS)) {
      if (
        mandate.maxOrderAmountPaise === p.maxOrderAmountPaise &&
        mandate.dailyBudgetPaise === p.dailyBudgetPaise
      ) {
        activePresetKey = k;
        break;
      }
    }

    return {
      mandate,
      todaySpentPaise,
      remainingDailyBudgetPaise,
      activePresetKey,
    };
  }
}

export const mandateService = new MandateService();
