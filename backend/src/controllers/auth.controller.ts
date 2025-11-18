import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { Role } from '@prisma/client';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(Role).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);

      const result = await AuthService.register(validatedData);

      sendSuccess(res, result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Registration failed', 500);
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);

      const result = await AuthService.login(validatedData);

      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 401);
        return;
      }
      sendError(res, 'Login failed', 500);
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      sendSuccess(res, user);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 404);
        return;
      }
      sendError(res, 'Failed to get user', 500);
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    // Since we're using stateless JWT, logout is handled client-side
    // by removing the token
    sendSuccess(res, { message: 'Logged out successfully' });
  }
}
