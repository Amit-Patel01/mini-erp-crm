import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issueMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new AppError(`Validation failed: ${issueMessages}`, 400, error.errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issueMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new AppError(`Query validation failed: ${issueMessages}`, 400, error.errors));
      } else {
        next(error);
      }
    }
  };
};
