import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { ChatService } from './chat.service.js';
import { CreateSessionInput, UpdateSessionInput, SendMessageInput } from './chat.schema.js';

export class ChatController {
  public async createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { title } = (req.body || {}) as CreateSessionInput;
    const session = await ChatService.createSession(req.user!.id, title);

    res.status(201).json({
      success: true,
      data: session,
    });
  }

  public async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const includeArchived = req.query.includeArchived === 'true';
    const sessions = await ChatService.getUserSessions(req.user!.id, includeArchived);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  }

  public async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessionId = req.params.id as string;
    const result = await ChatService.getSessionWithMessages(sessionId, req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  public async updateSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessionId = req.params.id as string;
    const { title, isArchived } = req.body as UpdateSessionInput;

    const updated = await ChatService.updateSession(sessionId, req.user!.id, { title, isArchived });

    res.status(200).json({
      success: true,
      data: updated,
    });
  }

  public async deleteSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessionId = req.params.id as string;
    await ChatService.deleteSession(sessionId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  }

  public async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessionId = req.params.id as string;
    const { content } = req.body as SendMessageInput;

    const result = await ChatService.sendMessage(sessionId, req.user!.id, content);

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  public async appendCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessionId = req.params.id as string;
    const { type, cardType, resourceId, cardData, sender, content } = req.body || {};

    const targetType = type || cardType;
    const targetResourceId =
      resourceId ||
      cardData?.orderId ||
      cardData?._id ||
      cardData?.paymentId ||
      cardData?.approvalId ||
      cardData?.cartId ||
      cardData?.mandateId;

    const message = await ChatService.appendCardMessage(
      sessionId,
      req.user!.id,
      targetType,
      targetResourceId,
      sender || 'AGENT',
      content
    );

    res.status(201).json({
      success: true,
      data: message,
    });
  }
}

export const chatController = new ChatController();
