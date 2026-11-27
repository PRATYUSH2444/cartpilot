import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { supportService } from './support.service.js';

export async function createSupportTicket(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { topic, message, name, email, phone } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const userEmail = req.user?.email || email;

    const result = await supportService.createTicket({
      userId,
      name: name || (req.user as any)?.name,
      email: userEmail,
      phone,
      topic,
      message,
    });

    res.status(201).json({
      success: true,
      data: {
        ticketId: result.ticketId,
        emailDelivered: result.emailDelivered,
        message: result.message,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMySupportTickets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.json({ success: true, data: [] });
      return;
    }
    const tickets = await supportService.getTicketsByUserId(userId);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
}
