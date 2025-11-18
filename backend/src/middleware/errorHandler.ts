import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    sendError(res, messages.join(', '), 400, 'VALIDATION_ERROR');
    return;
  }

  // Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      sendError(res, 'Record already exists', 409, 'DUPLICATE_RECORD');
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404, 'NOT_FOUND');
      return;
    }
  }

  // Default error
  sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    500,
    'INTERNAL_ERROR'
  );
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
};
