import { z } from 'zod';

export const productCategoryEnum = z.enum([
  'GRAINS',
  'PULSES',
  'DAIRY',
  'VEGETABLES',
  'SPICES',
  'OILS',
  'CONDIMENTS',
  'FRUITS_VEGETABLES',
  'DAIRY_BREAKFAST',
  'ATTA_RICE_DAL',
  'SNACKS_MUNCHIES',
  'COLD_DRINKS_JUICES',
  'BAKERY',
  'INSTANT_FROZEN_FOOD',
  'MASALA_DRY_FRUITS',
  'PERSONAL_CARE',
  'HOUSEHOLD_ESSENTIALS',
  'BABY_CARE',
  'PET_CARE',
]);

export const productSearchSchema = z.object({
  query: z.string().optional(),
  category: productCategoryEnum.optional(),
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
