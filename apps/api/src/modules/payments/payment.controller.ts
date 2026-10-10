import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { PaymentService } from './payment.service.js';
import { VerifyPaymentInput } from './payment.schema.js';

export class PaymentController {
  public static async verifyPayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        req.body as VerifyPaymentInput;

      const order = await PaymentService.verifyPayment({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully. Order confirmed!',
        data: {
          order,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async handleWebhook(
    req: Request & { rawBody?: Buffer },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string | undefined;
      const rawBody = req.rawBody;

      const result = await PaymentService.processWebhook(rawBody, signature);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
