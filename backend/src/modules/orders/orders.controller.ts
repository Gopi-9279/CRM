import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';

export const ordersController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await ordersService.getAll({ status: req.query.status as string });
      res.status(200).json({ success: true, data: orders });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.getById(req.params.id as string);
      res.status(200).json({ success: true, data: order });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const order = await ordersService.create(req.body, userId);
      res.status(201).json({ success: true, data: order });
    } catch (error) { next(error); }
  },

  async reserveItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const order = await ordersService.reserveItem(req.params.id as string, req.body.order_item_id, userId);
      res.status(200).json({ success: true, data: order });
    } catch (error) { next(error); }
  },
};
