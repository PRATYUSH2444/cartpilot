import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { CartService } from './cart.service.js';
import { AddCartItemInput, UpdateCartItemInput, UpdateDeliveryNoteInput } from './cart.schema.js';
import { realtimeService } from '../realtime/websocket.service.js';

export class CartController {
  public static async getCart(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const cart = await CartService.getOrCreateActiveCart(userId);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async addItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { productId, quantity } = req.body as AddCartItemInput;
      const cart = await CartService.addItem(userId, productId, quantity);
      realtimeService.emitCartUpdated(userId, cart);
      res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateItemQuantity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const productId = req.params.productId as string;
      const { quantity } = req.body as UpdateCartItemInput;
      const cart = await CartService.updateItemQuantity(userId, productId, quantity);
      realtimeService.emitCartUpdated(userId, cart);
      res.status(200).json({
        success: true,
        message: quantity === 0 ? 'Item removed from cart' : 'Item quantity updated',
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async removeItem(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const productId = req.params.productId as string;
      const cart = await CartService.removeItem(userId, productId);
      realtimeService.emitCartUpdated(userId, cart);
      res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async clearCart(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const cart = await CartService.clearCart(userId);
      realtimeService.emitCartUpdated(userId, cart);
      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateDeliveryNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { deliveryNote } = req.body as UpdateDeliveryNoteInput;
      const cart = await CartService.updateDeliveryNote(userId, deliveryNote || '');
      realtimeService.emitCartUpdated(userId, cart);
      res.status(200).json({
        success: true,
        message: 'Delivery note updated',
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  }
}
