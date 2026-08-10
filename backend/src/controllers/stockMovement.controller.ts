import { Response, NextFunction } from 'express';
import { StockMovementService } from '../services/stockMovement.service';
import { AuthenticatedRequest } from '../types/index';

export class StockMovementController {
  static async getStockMovements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await StockMovementService.getStockMovements(req.query);
      return res.status(200).json({
        success: true,
        data: result.movements,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createStockMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user!.name;
      const result = await StockMovementService.createStockMovement({
        ...req.body,
        createdBy,
      });
      return res.status(201).json({
        success: true,
        message: 'Stock movement recorded successfully',
        data: result.movement,
        updatedStock: result.updatedStock,
      });
    } catch (error) {
      next(error);
    }
  }
}
