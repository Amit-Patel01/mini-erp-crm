import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types/index';
import { ForbiddenError } from '../utils/errors';

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User context not found'));
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admin always has full access
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};
