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
      const orders =
        role === 'ADMIN' || role === 'MERCHANT'
          ? await OrderService.listAllOrders()
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
      const id = req.params.id as string;

      const order = await OrderService.getOrderById(id, userId, role);

      res.status(200).json({
        success: true,
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
      const id = req.params.id as string;

      const order = await OrderService.simulateStep(id, userId, role);

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
