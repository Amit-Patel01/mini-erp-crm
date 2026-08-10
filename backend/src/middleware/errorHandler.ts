import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${err.name || 'Error'}: ${err.message}`, err.stack || '');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? err.details : {}),
    });
  }

  // Handle Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const targetField = err.meta?.target
      ? Array.isArray(err.meta.target)
        ? err.meta.target.join(', ')
        : err.meta.target
      : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${targetField} already exists.`,
    });
  }

  // Handle Prisma foreign key constraint violation (P2003)
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message:
        'Cannot delete or update this record because it is referenced by existing sales delivery challans or operational entries.',
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
