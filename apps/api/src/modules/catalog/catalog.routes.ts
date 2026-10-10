import { Router } from 'express';
import { searchCatalog, getProduct, getCategories } from './catalog.controller.js';

export const catalogRouter = Router();

catalogRouter.get('/', searchCatalog);
catalogRouter.get('/categories', getCategories);
catalogRouter.get('/:id', getProduct);
