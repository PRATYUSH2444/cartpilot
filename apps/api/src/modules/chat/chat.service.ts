import mongoose from 'mongoose';
import { ChatSessionModel, IChatSession } from './chat-session.model.js';
import { ChatMessageModel, IChatMessage } from './chat-message.model.js';
import { AgentService, AgentTurnResult } from '../agent/agent.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';

export interface ChatSessionDetails {
  session: IChatSession;
  messages: IChatMessage[];
}

export interface SendMessageResponse {
  userMessage: IChatMessage;
  agentMessage: IChatMessage;
}

export class ChatService {
  /**
   * Creates a new conversational shopping session for the user.
   */
  public static async createSession(userId: string, title?: string): Promise<IChatSession> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const session = await ChatSessionModel.create({
      userId: userObjectId,
      title: title || 'New Grocery Shopping Session',
    });

    // Create initial welcome message
    await ChatMessageModel.create({
      sessionId: session._id,
      userId: userObjectId,
      sender: 'AGENT',
      content:
        'Welcome to CartPilot! I am your policy-controlled shopping assistant. I help you find strictly vegetarian groceries, plan meals, and assemble carts governed by deterministic spending mandates. The AI proposes, the policy engine decides, and you confirm payment.',
      cardType: 'rules',
      cardData: {
        maxOrderAmountPaise: 60000,
        dailyBudgetPaise: 150000,
        requireExplicitApproval: false,
      },
    });

    return session;
  }

  /**
   * Retrieves all chat sessions belonging to the user.
   */
  public static async getUserSessions(userId: string): Promise<IChatSession[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sessions = await ChatSessionModel.find({ userId: userObjectId }).sort({ updatedAt: -1 });
    return sessions;
  }

  /**
   * Retrieves a specific session and its full message history, enforcing ownership.
   */
  public static async getSessionWithMessages(
    sessionId: string,
    userId: string
  ): Promise<ChatSessionDetails> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestError('Invalid session ID format');
    }

    const session = await ChatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    if (session.userId.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this chat session');
    }

    const messages = await ChatMessageModel.find({ sessionId: session._id }).sort({ createdAt: 1 });

    return {
      session,
      messages,
    };
  }

  /**
   * Sends a user message, runs the sandboxed AI agent orchestrator, and saves both messages.
   */
  public static async sendMessage(
    sessionId: string,
    userId: string,
    content: string
  ): Promise<SendMessageResponse> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestError('Invalid session ID format');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const session = await ChatSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    if (session.userId.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this chat session');
    }

    // 1. Save User Message
    const userMessage = await ChatMessageModel.create({
      sessionId: session._id,
      userId: userObjectId,
      sender: 'USER',
      content: content.trim(),
    });

    // 2. Update session title if still default
    if (session.title === 'New Grocery Shopping Session') {
      const summaryTitle = content.length > 32 ? content.substring(0, 32) + '...' : content;
      session.title = summaryTitle;
      await session.save();
    } else {
      session.updatedAt = new Date();
      await session.save();
    }

    // 3. Fetch past messages for conversational context
    const previousMessages = await ChatMessageModel.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    const historyContext = previousMessages.map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    // 4. Run AI Agent multi-turn turn
    logger.info({ sessionId, userId, prompt: content }, 'Running AI Agent turn');
    const agentResult: AgentTurnResult = await AgentService.runTurn(
      userId,
      content,
      historyContext
    );

    // 5. Save Agent Message
    const agentMessage = await ChatMessageModel.create({
      sessionId: session._id,
      userId: userObjectId,
      sender: 'AGENT',
      content: agentResult.content,
      toolCalls: agentResult.toolCalls.length > 0 ? agentResult.toolCalls : undefined,
      cardType: agentResult.cardType,
      cardData: agentResult.cardData,
    });

    return {
      userMessage,
      agentMessage,
    };
  }
}
