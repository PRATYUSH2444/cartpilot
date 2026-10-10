import { z } from 'zod';

export const InitiateCheckoutSchema = z.object({
  shippingAddress: z
    .object({
      street: z.string().min(3, 'Street must be at least 3 characters'),
      city: z.string().min(2, 'City is required'),
      state: z.string().min(2, 'State is required'),
      postalCode: z.string().regex(/^\d{6}$/, 'Postal code must be a 6-digit Indian PIN code'),
    })
    .optional(),
});

export type InitiateCheckoutInput = z.infer<typeof InitiateCheckoutSchema>;
