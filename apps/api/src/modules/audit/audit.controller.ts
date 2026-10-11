import { Request, Response } from 'express';
import { auditService } from './audit.service.js';

export class AuditController {
  async getEvents(req: Request, res: Response): Promise<void> {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const eventType = req.query.eventType as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const result = await auditService.listEvents({ page, limit, eventType, resourceType });

    res.status(200).json({
      success: true,
      data: result.events,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  }

  async verifyChain(_req: Request, res: Response): Promise<void> {
    const verification = await auditService.verifyChain();

    res.status(200).json({
      success: verification.valid,
      data: verification,
    });
  }
}

export const auditController = new AuditController();
