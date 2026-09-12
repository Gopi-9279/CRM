import { Request, Response, NextFunction } from 'express';
import { workOrdersService } from './work-orders.service';

export const workOrdersController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const wos = await workOrdersService.getAll({
        status: req.query.status as string,
        location_id: req.query.location_id as string,
        assigned_user_id: req.query.assigned_user_id as string,
      });
      res.status(200).json({ success: true, data: wos });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const wo = await workOrdersService.getById(req.params.id as string);
      res.status(200).json({ success: true, data: wo });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const wo = await workOrdersService.create(req.body, userId);
      res.status(201).json({ success: true, data: wo });
    } catch (error) { next(error); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const wo = await workOrdersService.updateStatus(req.params.id as string, req.body.status, userId);
      res.status(200).json({ success: true, data: wo });
    } catch (error) { next(error); }
  },

  async getStockCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const stockCheck = await workOrdersService.getStockCheck(req.params.id as string);
      res.status(200).json({ success: true, data: stockCheck });
    } catch (error) { next(error); }
  },
};
