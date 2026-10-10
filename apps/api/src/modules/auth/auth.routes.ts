import { Router } from 'express';
import { register, login, refresh, logout, getMe } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { authenticate } from '../../common/middleware/auth.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/refresh', validate(refreshSchema), refresh);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, getMe);
