import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { UserService } from './user.service.js';

export class UserController {
  public static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await UserService.getProfile(req.user!.userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updated = await UserService.updateProfile(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await UserService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password changed successfully. All other sessions invalidated.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getWallet(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const wallet = await UserService.getWallet(req.user!.userId);
      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async topUpWallet(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { amountPaise } = req.body;
      const wallet = await UserService.topUpWallet(req.user!.userId, Number(amountPaise));
      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markNotificationsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { readIds } = req.body;
      const updatedIds = await UserService.markNotificationsRead(
        req.user!.userId,
        Array.isArray(readIds) ? readIds : []
      );

      // Instantaneous real-time broadcast to all active sessions & devices of this user
      const { realtimeService } = await import('../realtime/websocket.service.js');
      realtimeService.emitNotificationsRead(req.user!.userId, updatedIds);

      res.status(200).json({
        success: true,
        data: {
          readNotificationIds: updatedIds,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
