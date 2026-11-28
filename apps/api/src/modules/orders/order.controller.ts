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

  public static async getTodayBoard(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const board = await OrderService.getAdminTodayBoard();
      res.status(200).json({ success: true, data: board });
    } catch (err) {
      next(err);
    }
  }

  public static async getProcurement(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetDate = req.query.targetDate as string | undefined;
      const slot = req.query.slot as string | undefined;
      const list = await OrderService.getProcurementList(targetDate, slot);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static async getPackingChecklist(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetDate = req.query.targetDate as string | undefined;
      const slot = req.query.slot as string | undefined;
      const list = await OrderService.getPackingChecklist(targetDate, slot);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static async getDeliveryManifest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetDate = req.query.targetDate as string | undefined;
      const slot = req.query.slot as string | undefined;
      const manifest = await OrderService.getDeliveryManifest(targetDate, slot);
      res.status(200).json({ success: true, data: manifest });
    } catch (err) {
      next(err);
    }
  }

  public static async advanceFulfilmentStage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const stage = req.body.stage as 'PROCURED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
      const actorId = req.user!.userId;
      const actorRole = req.user!.role;

      const order = await OrderService.advanceFulfilmentStage(id, stage, actorId, actorRole);
      res.status(200).json({
        success: true,
        message: `Order advanced to stage ${stage}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async generateLots(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { targetDate, slot } = req.body || {};
      const lots = await OrderService.generateMerchantLots(targetDate, slot);
      res.status(200).json({
        success: true,
        message: `Generated ${lots.length} merchant pickup lots`,
        data: lots,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMerchantLots(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const merchantId = req.user!.merchantId;
      if (!merchantId) {
        res.status(200).json({ success: true, data: [] });
        return;
      }
      const lots = await OrderService.getMerchantLots(merchantId);
      res.status(200).json({ success: true, data: lots });
    } catch (err) {
      next(err);
    }
  }

  public static async updateLotStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const lotId = req.params.lotId as string;
      const { status, notes } = req.body || {};
      const lot = await OrderService.updateLotStatus(lotId, status, notes);
      res.status(200).json({ success: true, data: lot });
    } catch (err) {
      next(err);
    }
  }

  public static async getFieldRun(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token as string;
      const lot = await OrderService.getFieldRunByToken(token);
      res.status(200).json({ success: true, data: lot });
    } catch (err) {
      next(err);
    }
  }

  public static async collectFieldRun(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token as string;
      const lot = await OrderService.markLotCollectedByRunner(token);
      res.status(200).json({
        success: true,
        message: 'Merchant lot marked as collected by runner',
        data: lot,
      });
    } catch (err) {
      next(err);
    }
  }
}
