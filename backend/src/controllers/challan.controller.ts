import { Response, NextFunction } from 'express';
import { ChallanService } from '../services/challan.service';
import { AuthenticatedRequest } from '../types/index';

export class ChallanController {
  static async getChallans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ChallanService.getChallans(req.query);
      return res.status(200).json({
        success: true,
        data: result.challans,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChallanById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const challan = await ChallanService.getChallanById(req.params.id);
      return res.status(200).json({
        success: true,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user!.name;
      const challan = await ChallanService.createChallan(req.body, createdBy);
      return res.status(201).json({
        success: true,
        message: `Sales Challan ${challan.challanNumber} created as ${challan.status}`,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirmChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = { userId: req.user!.userId, name: req.user!.name };
      const challan = await ChallanService.confirmChallan(req.params.id, user);
      return res.status(200).json({
        success: true,
        message: `Sales Challan ${challan.challanNumber} confirmed and stock reduced successfully`,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelChallan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = { userId: req.user!.userId, name: req.user!.name };
      const challan = await ChallanService.cancelChallan(req.params.id, user);
      return res.status(200).json({
        success: true,
        message: `Sales Challan ${challan.challanNumber} cancelled successfully`,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }
}
