import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { OrderService } from './order.service.js';

export class OrderController {
  public static async listOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const merchantId = req.user!.merchantId;
      const orders =
        role === 'ADMIN'
          ? await OrderService.listAllOrders()
          : role === 'MERCHANT' && merchantId
            ? await OrderService.listMerchantOrders(merchantId)
            : await OrderService.listUserOrders(userId);

      res.status(200).json({
        success: true,
        data: orders,
        meta: {
          total: orders.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const merchantId = req.user!.merchantId;
      const id = req.params.id as string;

      const order = await OrderService.getOrderById(id, userId, role, merchantId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async acceptOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const merchantId = req.user!.merchantId;
      const id = req.params.id as string;

      const order = await OrderService.acceptOrder(id, userId, role, merchantId);

      res.status(200).json({
        success: true,
        message: `Order accepted and moved to ${order.status}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async rejectOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const merchantId = req.user!.merchantId;
      const id = req.params.id as string;
      const { reason } = req.body || {};

      const order = await OrderService.rejectOrder(id, userId, role, merchantId, reason);

      res.status(200).json({
        success: true,
        message: 'Order rejected',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const merchantId = req.user!.merchantId;
      const id = req.params.id as string;
      const { status, reason } = req.body || {};

      if (!status) {
        const order = await OrderService.simulateStep(id, userId, role, merchantId);
        res.status(200).json({
          success: true,
          message: `Order status advanced to ${order.status}`,
          data: order,
        });
        return;
      }

      const order = await OrderService.updateOrderStatus(id, status, userId, role, merchantId, reason);
      res.status(200).json({
        success: true,
        message: `Order status updated to ${order.status}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

    public static async simulateStep(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const merchantId = req.user!.merchantId;
      const id = req.params.id as string;

      const order = await OrderService.simulateStep(id, userId, role, merchantId);

      res.status(200).json({
        success: true,
        message: `Order status advanced to ${order.status}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderProof(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const id = req.params.id as string;

      const proof = await OrderService.getOrderProof(id, userId, role);

      res.status(200).json({
        success: true,
        data: proof,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyOrderProof(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const id = req.params.id as string;

      const verification = await OrderService.verifyOrderProof(id, userId, role);

      res.status(200).json({
        success: true,
        data: verification,
      });
    } catch (err) {
      next(err);
    }
  }
}
