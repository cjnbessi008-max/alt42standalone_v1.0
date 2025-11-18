import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { Role } from '@prisma/client';

interface JWTPayload {
  id: string;
  email: string;
  role: Role;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401, 'NO_TOKEN');
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
      return;
    }
    sendError(res, 'Authentication failed', 401, 'AUTH_FAILED');
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        'Insufficient permissions',
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
};
