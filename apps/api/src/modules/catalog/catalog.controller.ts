import { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service.js';
import { productSearchSchema } from './catalog.schema.js';

export async function searchCatalog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedParams = productSearchSchema.parse(req.query);
    const result = await CatalogService.searchCatalog(validatedParams);

    res.status(200).json({
      success: true,
      data: result.products,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const product = await CatalogService.getProductById(id as string);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await CatalogService.getCategories();

    res.status(200).json({
      success: true,
      data: categories,
      meta: { total: categories.length },
    });
  } catch (error) {
    next(error);
  }
}
