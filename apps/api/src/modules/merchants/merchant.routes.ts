import { Router } from 'express';
import { listMerchants, getMerchant, getMerchantProducts } from './merchant.controller.js';

export const merchantRouter = Router();

merchantRouter.get('/', listMerchants);
merchantRouter.get('/:id', getMerchant);
merchantRouter.get('/:id/products', getMerchantProducts);
