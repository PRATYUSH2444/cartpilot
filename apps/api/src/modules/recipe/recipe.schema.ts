import { z } from 'zod';

export const ResolveRecipeSchema = z.object({
  dishName: z.string().min(1, 'Dish name or recipe query is required').trim(),
  servings: z.coerce.number().int().positive().max(50).default(4),
  ingredients: z.array(z.string().trim().min(1)).optional(),
});

export type ResolveRecipeInput = z.infer<typeof ResolveRecipeSchema>;
