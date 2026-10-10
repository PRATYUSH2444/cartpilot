import { Request, Response, NextFunction } from 'express';
import { MerchantService } from './merchant.service.js';

export async function listMerchants(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const merchants = await MerchantService.listActiveMerchants();
    res.status(200).json({
      success: true,
      data: merchants,
      meta: { total: merchants.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const merchant = await MerchantService.getMerchantById(id as string);
    res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMerchantProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const products = await MerchantService.getMerchantProducts(id as string);
    res.status(200).json({
      success: true,
      data: products,
      meta: { total: products.length },
    });
  } catch (error) {
    next(error);
  }
}
