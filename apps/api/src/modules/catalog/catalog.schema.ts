import { z } from 'zod';

export const productSearchSchema = z.object({
  query: z.string().optional(),
  category: z
    .enum(['GRAINS', 'PULSES', 'DAIRY', 'VEGETABLES', 'SPICES', 'OILS', 'CONDIMENTS'])
    .optional(),
  merchantId: z.string().optional(),
  minPricePaise: z.coerce.number().min(0).optional(),
  maxPricePaise: z.coerce.number().min(0).optional(),
  inStockOnly: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ProductSearchQuery = z.infer<typeof productSearchSchema>;
