import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let stack = err.stack;

  // If it's an AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // MySQL errors
  if (err.name === 'SqlError' || (err as any).code?.startsWith('ER_')) {
    statusCode = 400;
    message = 'Database error';

    // Specific MySQL errors
    if ((err as any).code === 'ER_DUP_ENTRY') {
      message = 'Duplicate entry - record already exists';
    } else if ((err as any).code === 'ER_NO_REFERENCED_ROW') {
      message = 'Referenced record does not exist';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Log error
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Send response
  const response: any = {
    error: message,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = stack;
    response.originalError = err.message;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
