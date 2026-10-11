import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateRequest } from '../../common/middleware/validate.js';
import { recipeController } from './recipe.controller.js';
import { ResolveRecipeSchema } from './recipe.schema.js';

export const recipeRouter = Router();

recipeRouter.post(
  '/resolve',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN'),
  validateRequest(ResolveRecipeSchema),
  (req, res, next) => recipeController.resolve(req, res).catch(next)
);
