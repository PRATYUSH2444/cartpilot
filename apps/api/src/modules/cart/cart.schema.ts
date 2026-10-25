import { z } from 'zod';

export const AddCartItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format'),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Quantity cannot exceed 99'),
});

export const UpdateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(0, 'Quantity cannot be negative')
    .max(99, 'Quantity cannot exceed 99'),
});

export const ProductIdParamSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID format'),
});

export const UpdateDeliveryNoteSchema = z.object({
  deliveryNote: z.string().max(500, 'Delivery note cannot exceed 500 characters').optional().default(''),
});

export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type UpdateDeliveryNoteInput = z.infer<typeof UpdateDeliveryNoteSchema>;
