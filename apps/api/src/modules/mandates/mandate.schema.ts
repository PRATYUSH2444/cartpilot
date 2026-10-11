import { z } from 'zod';

export const UpdateMandateSchema = z.object({
  maxOrderAmountPaise: z
    .number()
    .int()
    .positive('Max order amount must be a positive integer in paise')
    .min(100, 'Minimum order limit is ₹1.00 (100 paise)')
    .optional(),
  dailyBudgetPaise: z
    .number()
    .int()
    .positive('Daily budget must be a positive integer in paise')
    .min(100, 'Minimum daily budget is ₹1.00 (100 paise)')
    .optional(),
  allowedMerchantIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid merchant ObjectId'))
    .optional(),
  blockedCategories: z.array(z.string().trim().min(1)).optional(),
  requireExplicitApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateMandateInput = z.infer<typeof UpdateMandateSchema>;
