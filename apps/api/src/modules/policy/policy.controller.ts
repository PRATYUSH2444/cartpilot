import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { policyService } from './policy.service.js';

export class PolicyController {
  async evaluate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await policyService.evaluateCart(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  async simulate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await policyService.simulate(userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  async applyRemedy(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await policyService.applyRemedy(userId, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.policy,
    });
  }
}

export const policyController = new PolicyController();
