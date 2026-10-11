import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { RecipeService } from './recipe.service.js';
import { ResolveRecipeInput } from './recipe.schema.js';

export class RecipeController {
  public async resolve(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { dishName, servings, ingredients } = req.body as ResolveRecipeInput;

    const result = await RecipeService.resolveRecipe(dishName, servings, ingredients);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

export const recipeController = new RecipeController();
