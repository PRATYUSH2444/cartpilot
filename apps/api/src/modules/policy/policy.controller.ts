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
}

export const policyController = new PolicyController();
