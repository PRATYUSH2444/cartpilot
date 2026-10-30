import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.js';
import { AddressController } from './address.controller.js';

export const addressRouter = Router();

// Public or authenticated check serviceability
addressRouter.get('/serviceability', AddressController.checkServiceability);
addressRouter.post('/serviceability', AddressController.checkServiceability);

// Authenticated customer address management
addressRouter.get('/', requireAuth, AddressController.listAddresses);
addressRouter.post('/', requireAuth, AddressController.createAddress);
addressRouter.get('/:id', requireAuth, AddressController.getAddress);
addressRouter.put('/:id', requireAuth, AddressController.updateAddress);
addressRouter.delete('/:id', requireAuth, AddressController.deleteAddress);
addressRouter.post('/:id/default', requireAuth, AddressController.setDefaultAddress);
