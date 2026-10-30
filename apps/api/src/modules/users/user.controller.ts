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
}
