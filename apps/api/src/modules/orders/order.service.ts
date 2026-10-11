import mongoose from 'mongoose';
import { OrderModel, IOrder, OrderStatus } from './order.model.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';

export class OrderService {
  /**
   * Retrieves orders for the authenticated user, newest first.
   */
  public static async listUserOrders(userId: string): Promise<IOrder[]> {
    return OrderModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({
      createdAt: -1,
    });
  }

  /**
   * Retrieves all orders across the platform (for Admin and Merchant dashboards), newest first.
   */
  public static async listAllOrders(): Promise<IOrder[]> {
    return OrderModel.find({}).sort({
      createdAt: -1,
    });
  }

  /**
   * Retrieves an order by ID with ownership enforcement.
   */
  public static async getOrderById(
    orderId: string,
    userId: string,
    role?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(new mongoose.Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (role !== 'ADMIN' && role !== 'MERCHANT' && order.userId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to view this order');
    }

    return order;
  }

  /**
   * Calculates total spend in integer paise by the user today across confirmed orders.
   */
  public static async getDailySpendForUser(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const orders = await OrderModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: startOfDay },
      status: { $in: ['PAID', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    }).select('pricingSnapshot.totalPaise');

    return orders.reduce((sum, order) => sum + (order.pricingSnapshot?.totalPaise || 0), 0);
  }

  /**
   * Simulates progressive fulfillment steps for testing and demo:
   * CONFIRMED -> PACKING -> OUT_FOR_DELIVERY -> DELIVERED
   */
  public static async simulateStep(
    orderId: string,
    userId: string,
    role?: string
  ): Promise<IOrder> {
    const order = await this.getOrderById(orderId, userId, role);

    const validTransitions: Record<string, OrderStatus> = {
      CONFIRMED: 'PACKING',
      PACKING: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    };

    const nextStatus = validTransitions[order.status];
    if (!nextStatus) {
      throw new BadRequestError(
        `Cannot advance fulfillment from status "${order.status}". Valid prior states: CONFIRMED, PACKING, OUT_FOR_DELIVERY.`
      );
    }

    order.status = nextStatus;
    if (nextStatus === 'DELIVERED') {
      order.deliveredAt = new Date();
    }

    await order.save();
    logger.info({ orderId: order._id, newStatus: nextStatus }, 'Advanced order fulfillment step');

    return order;
  }
}
