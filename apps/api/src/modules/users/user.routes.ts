import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.js';
import { UserController } from './user.controller.js';

export const userRouter = Router();

userRouter.get('/profile', requireAuth, UserController.getProfile);
userRouter.put('/profile', requireAuth, UserController.updateProfile);
userRouter.post('/change-password', requireAuth, UserController.changePassword);
userRouter.get('/wallet', requireAuth, UserController.getWallet);
userRouter.post('/wallet/top-up', requireAuth, UserController.topUpWallet);
