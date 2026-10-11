import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { approvalService } from './approval.service.js';

export class ApprovalController {
  async getPendingApproval(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const pending = await approvalService.getPendingApprovalForUser(userId);

    res.status(200).json({
      success: true,
      data: pending,
    });
  }

  async approve(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const approvalId = req.params.id as string;

    const approval = await approvalService.approve(userId, approvalId);

    res.status(200).json({
      success: true,
      message: 'Cryptographic approval successfully recorded',
      data: approval,
    });
  }

  async reject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const approvalId = req.params.id as string;
    const reason = req.body.reason as string | undefined;

    const approval = await approvalService.reject(userId, approvalId, reason);

    res.status(200).json({
      success: true,
      message: 'Approval request rejected',
      data: approval,
    });
  }
}

export const approvalController = new ApprovalController();
