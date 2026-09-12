import { ErrorRequestHandler } from 'express';
import { logger } from '../lib/logger';
import { z } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors
      }
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
