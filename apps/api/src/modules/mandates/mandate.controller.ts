import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { mandateService } from './mandate.service.js';

export class MandateController {
  async getMandate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await mandateService.getMandateWithDailySpend(userId);

    res.status(200).json({
      success: true,
      data: {
        mandate: result.mandate,
        todaySpentPaise: result.todaySpentPaise,
        remainingDailyBudgetPaise: result.remainingDailyBudgetPaise,
      },
    });
  }

  async updateMandate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const updated = await mandateService.updateMandate(userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Spending mandate updated successfully',
      data: updated,
    });
  }

  async getPresets(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = mandateService.getPresets();
    res.status(200).json({
      success: true,
      data,
    });
  }

  async applyPreset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const key = (req.params.key as string) || '';
    const result = await mandateService.applyPreset(userId, key);

    res.status(200).json({
      success: true,
      message: `Preset "${key}" applied successfully`,
      data: result,
    });
  }
}

export const mandateController = new MandateController();
