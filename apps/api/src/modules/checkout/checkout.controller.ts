import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { CheckoutService } from './checkout.service.js';
import { InitiateCheckoutInput } from './checkout.schema.js';

export class CheckoutController {
  public static async initiate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as InitiateCheckoutInput;
      const result = await CheckoutService.initiateCheckout(userId, input);

      res.status(201).json({
        success: true,
        message: 'Checkout initiated. Complete payment to finalize order.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
