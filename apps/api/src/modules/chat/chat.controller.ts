import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { ChatService } from './chat.service.js';
import { CreateSessionInput, SendMessageInput } from './chat.schema.js';

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
    const sessions = await ChatService.getUserSessions(req.user!.id);

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

  public async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessionId = req.params.id as string;
    const { content } = req.body as SendMessageInput;

    const result = await ChatService.sendMessage(sessionId, req.user!.id, content);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

export const chatController = new ChatController();
