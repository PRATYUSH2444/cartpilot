import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.js';
import { validateBody, validateParams } from '../../common/middleware/validate.js';
import { CartController } from './cart.controller.js';
import { AddCartItemSchema, UpdateCartItemSchema, ProductIdParamSchema, UpdateDeliveryNoteSchema } from './cart.schema.js';

export const cartRouter = Router();

// All cart operations require authentication
cartRouter.use(requireAuth);

cartRouter.get('/', CartController.getCart);
cartRouter.patch('/delivery-note', validateBody(UpdateDeliveryNoteSchema), CartController.updateDeliveryNote);
cartRouter.post('/items', validateBody(AddCartItemSchema), CartController.addItem);
cartRouter.patch(
  '/items/:productId',
  validateParams(ProductIdParamSchema),
  validateBody(UpdateCartItemSchema),
  CartController.updateItemQuantity
);
cartRouter.delete(
  '/items/:productId',
  validateParams(ProductIdParamSchema),
  CartController.removeItem
);
cartRouter.delete('/', CartController.clearCart);
