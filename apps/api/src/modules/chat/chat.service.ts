import mongoose from 'mongoose';
import { ChatSessionModel, IChatSession } from './chat-session.model.js';
import { ChatMessageModel, IChatMessage } from './chat-message.model.js';
import { AgentService, AgentTurnResult } from '../agent/agent.service.js';
import { ChatRouterService } from './chat-router.service.js';
import { MandateModel } from '../mandates/mandate.model.js';
import { OrderModel } from '../orders/order.model.js';
import { PaymentModel } from '../payments/payment.model.js';
import { ApprovalModel } from '../approvals/approval.model.js';
import { CartModel } from '../cart/cart.model.js';
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

    // Read user's real mandate configuration for welcome rules card
    const mandate = await MandateModel.findOne({ userId: userObjectId, isActive: true });

    // Create initial welcome message with actual mandate limits
    await ChatMessageModel.create({
      sessionId: session._id,
      userId: userObjectId,
      sender: 'AGENT',
      content:
        "I'm CartPilot. Tell me what you're cooking or your budget, and I'll build a vegetarian cart. Nothing is ordered until you approve.",
      cardType: 'rules',
      cardData: {
        autoApproveUpToPaise: mandate ? mandate.autoApproveUpToPaise : 30000,
        maxOrderAmountPaise: mandate ? mandate.maxOrderAmountPaise : 100000,
        perOrderCapPaise: mandate ? (mandate.perOrderCapPaise || mandate.maxOrderAmountPaise) : 100000,
        dailyBudgetPaise: mandate ? mandate.dailyBudgetPaise : 150000,
        dailyCapPaise: mandate ? (mandate.dailyCapPaise || mandate.dailyBudgetPaise) : 150000,
        requireExplicitApproval: mandate ? mandate.requireExplicitApproval : false,
      },
    });

    return session;
  }

  /**
   * Retrieves all chat sessions belonging to the user.
   */
  public static async getUserSessions(userId: string, includeArchived = false): Promise<IChatSession[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: any = { userId: userObjectId };
    if (!includeArchived) {
      filter.isArchived = { $ne: true };
    }
    const sessions = await ChatSessionModel.find(filter).sort({ updatedAt: -1 });
    return sessions;
  }

  /**
   * Updates a session's title or archived status, enforcing user ownership.
   */
  public static async updateSession(
    sessionId: string,
    userId: string,
    updates: { title?: string; isArchived?: boolean }
  ): Promise<IChatSession> {
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

    if (updates.title !== undefined) {
      session.title = updates.title.trim();
    }
    if (updates.isArchived !== undefined) {
      session.isArchived = updates.isArchived;
    }

    session.updatedAt = new Date();
    await session.save();
    return session;
  }

  /**
   * Deletes a chat session and cascades deletion of its messages, enforcing user ownership.
   */
  public static async deleteSession(sessionId: string, userId: string): Promise<void> {
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

    await ChatMessageModel.deleteMany({ sessionId: session._id });
    await ChatSessionModel.findByIdAndDelete(session._id);
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

    const messages = await ChatMessageModel.find({ sessionId: session._id }).sort({ createdAt: 1 }).lean();

    // Authoritatively rehydrate server-owned card data from real database resources
    for (const msg of messages) {
      if (msg.resourceType && msg.resourceId) {
        try {
          if (msg.resourceType === 'order') {
            const order = await OrderModel.findById(msg.resourceId).lean();
            if (order) {
              msg.cardData = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                totalPaise: order.pricingSnapshot.totalPaise,
                itemsCount: order.items.length,
                placedAt: order.placedAt,
                items: order.items,
                pricingSnapshot: order.pricingSnapshot,
                deliveryNote: order.deliveryNote,
                shippingAddressSnapshot: order.shippingAddressSnapshot,
                _id: order._id,
              };
            }
          } else if (msg.resourceType === 'payment') {
            const payment = await PaymentModel.findOne({
              $or: [{ _id: msg.resourceId }, { orderId: msg.resourceId }],
            }).lean();
            if (payment) {
              msg.cardData = {
                paymentId: payment._id,
                orderId: payment.orderId,
                gatewayOrderId: payment.gatewayOrderId,
                gatewayPaymentId: payment.gatewayPaymentId,
                amountPaise: payment.amountPaise,
                status: payment.status,
              };
            }
          } else if (msg.resourceType === 'approval') {
            const approval = await ApprovalModel.findById(msg.resourceId).lean();
            if (approval) {
              msg.cardData = {
                approvalId: approval._id,
                cartId: approval.cartId,
                status: approval.status,
                calculatedTotalPaise: approval.calculatedTotalPaise,
                approvalHash: approval.approvalHash,
              };
            }
          } else if (msg.resourceType === 'rules') {
            const mandate = await MandateModel.findById(msg.resourceId).lean();
            if (mandate) {
              msg.cardData = {
                mandateId: mandate._id,
                version: mandate.version,
                autoApproveUpToPaise: mandate.autoApproveUpToPaise,
                perOrderCapPaise: (mandate as any).perOrderCapPaise || mandate.maxOrderAmountPaise,
                dailyCapPaise: (mandate as any).dailyCapPaise || mandate.dailyBudgetPaise,
              };
            }
          } else if (msg.resourceType === 'cart') {
            const cart = await CartModel.findById(msg.resourceId).lean();
            if (cart) {
              msg.cardData = {
                cartId: cart._id,
                version: cart.version,
                itemsCount: cart.items.length,
                totalPaise: (cart as any).pricing?.totalPaise ?? 0,
              };
            }
          }
        } catch (e) {
          logger.warn({ err: e, msgId: msg._id }, 'Error rehydrating card resource');
        }
      }
    }

    return {
      session,
      messages: messages as any,
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

    // 3. Fetch past messages for conversational context (excluding current user message to prevent duplicates)
    const previousMessages = await ChatMessageModel.find({
      sessionId: session._id,
      _id: { $ne: userMessage._id },
    })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    const historyContext = previousMessages.map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    // Find active dish and active servings from prior messages for context continuity
    let activeDish: string | undefined;
    let activeServings: number | undefined;
    for (let i = previousMessages.length - 1; i >= 0; i--) {
      const pm: any = previousMessages[i];
      if (pm.cardType === 'items' && pm.cardData?.dishName) {
        activeDish = pm.cardData.dishName;
        activeServings = pm.cardData.servings;
        break;
      }
    }

    // 4. Deterministic Router pass (Resolves greetings, thanks, non-veg notice, servings & cached recipes with 0 LLM calls)
    const routerResult = await ChatRouterService.route(userId, content, {
      activeDish,
      activeServings,
    });

    let agentMessage: IChatMessage;

    if (routerResult.handled) {
      logger.info({ sessionId, userId, prompt: content, cardType: routerResult.cardType }, '⚡ Turn resolved via Deterministic Router');
      agentMessage = await ChatMessageModel.create({
        sessionId: session._id,
        userId: userObjectId,
        sender: 'AGENT',
        content: routerResult.content,
        cardType: routerResult.cardType,
        cardData: routerResult.cardData,
      });
    } else {
      // 5. Fallback: Run AI Agent multi-turn turn for open-ended queries
      logger.info({ sessionId, userId, prompt: content }, 'Running AI Agent turn');
      const agentResult: AgentTurnResult = await AgentService.runTurn(
        userId,
        content,
        historyContext
      );

      agentMessage = await ChatMessageModel.create({
        sessionId: session._id,
        userId: userObjectId,
        sender: 'AGENT',
        content: agentResult.content,
        toolCalls: agentResult.toolCalls.length > 0 ? agentResult.toolCalls : undefined,
        cardType: agentResult.cardType,
        cardData: agentResult.cardData,
      });
    }

    return {
      userMessage,
      agentMessage,
    };
  }

  /**
   * Appends an authoritative server-owned card message to an active chat session.
   * Rejects spoofed card contents, enforces resource ownership and verification.
   */
  public static async appendCardMessage(
    sessionId: string,
    userId: string,
    type: string,
    resourceId: string,
    sender: 'AGENT' | 'SYSTEM' | 'USER' = 'AGENT',
    contentOverride?: string
  ): Promise<IChatMessage> {
    const ALLOWED_CARD_TYPES = ['order', 'payment', 'approval', 'rules', 'cart'] as const;
    type AllowedCardType = (typeof ALLOWED_CARD_TYPES)[number];

    if (!type || !ALLOWED_CARD_TYPES.includes(type as AllowedCardType)) {
      throw new BadRequestError(
        `Invalid card resource type: '${type}'. Allowed types are: ${ALLOWED_CARD_TYPES.join(', ')}`
      );
    }

    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      throw new BadRequestError('A valid resourceId ObjectId is required');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sessionObjectId = new mongoose.Types.ObjectId(sessionId);

    const session = await ChatSessionModel.findOne({ _id: sessionObjectId, userId: userObjectId });
    if (!session) {
      throw new NotFoundError('Chat session not found or does not belong to user');
    }

    let resourceVersion = 1;
    let cardData: Record<string, any> = {};
    let content = contentOverride;

    if (type === 'order') {
      const order = await OrderModel.findById(resourceId);
      if (!order) {
        throw new NotFoundError(`Order with ID ${resourceId} does not exist`);
      }
      if (order.userId.toString() !== userId) {
        throw new ForbiddenError("Access denied: card belongs to another user's order");
      }
      resourceVersion = 1;
      cardData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPaise: order.pricingSnapshot.totalPaise,
        itemsCount: order.items.length,
        placedAt: order.placedAt,
        items: order.items,
        pricingSnapshot: order.pricingSnapshot,
        deliveryNote: order.deliveryNote,
        shippingAddressSnapshot: order.shippingAddressSnapshot,
        _id: order._id,
      };
      if (!content) {
        content = `Order #${order.orderNumber} confirmed (${order.items.length} items, ₹${(order.pricingSnapshot.totalPaise / 100).toFixed(2)})`;
      }
    } else if (type === 'payment') {
      let payment = await PaymentModel.findById(resourceId);
      if (!payment) {
        payment = await PaymentModel.findOne({ orderId: new mongoose.Types.ObjectId(resourceId) });
      }
      if (!payment) {
        throw new NotFoundError(`Payment with ID ${resourceId} does not exist`);
      }
      if (payment.userId.toString() !== userId) {
        throw new ForbiddenError("Access denied: card belongs to another user's payment");
      }
      if (payment.status !== 'PAID') {
        throw new BadRequestError(`Cannot save payment card: payment is not verified (status: ${payment.status})`);
      }
      resourceVersion = 1;
      cardData = {
        paymentId: payment._id,
        orderId: payment.orderId,
        gatewayOrderId: payment.gatewayOrderId,
        gatewayPaymentId: payment.gatewayPaymentId,
        amountPaise: payment.amountPaise,
        status: payment.status,
      };
      if (!content) {
        content = `Payment verified for Order (₹${(payment.amountPaise / 100).toFixed(2)})`;
      }
    } else if (type === 'approval') {
      const approval = await ApprovalModel.findById(resourceId);
      if (!approval) {
        throw new NotFoundError(`Approval with ID ${resourceId} does not exist`);
      }
      if (approval.userId.toString() !== userId) {
        throw new ForbiddenError("Access denied: card belongs to another user's approval");
      }
      resourceVersion = approval.cartVersion || 1;
      cardData = {
        approvalId: approval._id,
        cartId: approval.cartId,
        status: approval.status,
        calculatedTotalPaise: approval.calculatedTotalPaise,
        approvalHash: approval.approvalHash,
      };
      if (!content) {
        content = `Autonomous policy check: cart total requires human confirmation`;
      }
    } else if (type === 'rules') {
      const mandate = await MandateModel.findById(resourceId);
      if (!mandate) {
        throw new NotFoundError(`Mandate with ID ${resourceId} does not exist`);
      }
      if (mandate.userId.toString() !== userId) {
        throw new ForbiddenError("Access denied: card belongs to another user's mandate");
      }
      resourceVersion = mandate.version || 1;
      cardData = {
        mandateId: mandate._id,
        version: mandate.version,
        autoApproveUpToPaise: mandate.autoApproveUpToPaise,
        perOrderCapPaise: (mandate as any).perOrderCapPaise || mandate.maxOrderAmountPaise,
        dailyCapPaise: (mandate as any).dailyCapPaise || mandate.dailyBudgetPaise,
      };
      if (!content) {
        content = `Active autonomous shopping mandate rules`;
      }
    } else if (type === 'cart') {
      const cart = await CartModel.findById(resourceId);
      if (!cart) {
        throw new NotFoundError(`Cart with ID ${resourceId} does not exist`);
      }
      if (cart.userId.toString() !== userId) {
        throw new ForbiddenError("Access denied: card belongs to another user's cart");
      }
      resourceVersion = cart.version || 1;
      cardData = {
        cartId: cart._id,
        version: cart.version,
        itemsCount: cart.items.length,
        totalPaise: (cart as any).pricing?.totalPaise ?? 0,
      };
      if (!content) {
        content = `Active shopping cart (${cart.items.length} items)`;
      }
    }

    const message = await ChatMessageModel.create({
      sessionId: session._id,
      userId: userObjectId,
      sender,
      content,
      cardType: type as any,
      resourceType: type as any,
      resourceId: new mongoose.Types.ObjectId(resourceId),
      resourceVersion,
      cardData,
    });

    session.updatedAt = new Date();
    await session.save();

    return message;
  }
}
