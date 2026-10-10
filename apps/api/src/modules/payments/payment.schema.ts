import { z } from 'zod';

export const VerifyPaymentSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID format'),
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
