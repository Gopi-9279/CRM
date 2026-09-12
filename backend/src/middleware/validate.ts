import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../lib/errors';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        (error as any).errors.forEach((e: any) => {
          if (e.path.length > 1) {
            details[e.path.slice(1).join('.')] = e.message;
          } else {
            details[e.path[0]] = e.message;
          }
        });
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};
