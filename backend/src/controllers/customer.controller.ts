import { Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { AuthenticatedRequest } from '../types/index';

export class CustomerController {
  static async getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await CustomerService.getCustomers(req.query);
      return res.status(200).json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      return res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { notes, followUpDate } = req.body;
      const createdBy = req.user!.name;
      const followUp = await CustomerService.addFollowUp(req.params.id, notes, followUpDate, createdBy);
      return res.status(201).json({
        success: true,
        message: 'Follow-up recorded successfully',
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFollowUps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const followUps = await CustomerService.getFollowUps(req.params.id);
      return res.status(200).json({
        success: true,
        data: followUps,
      });
    } catch (error) {
      next(error);
    }
  }
}
