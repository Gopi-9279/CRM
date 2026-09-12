import { Request, Response, NextFunction } from 'express';
import { transfersService } from './transfers.service';

export const transfersController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const transfers = await transfersService.getAll({ status: req.query.status as string });
      res.status(200).json({ success: true, data: transfers });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const transfer = await transfersService.create(req.body, userId);
      res.status(201).json({ success: true, data: transfer });
    } catch (error) { next(error); }
  },

  async dispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const transfer = await transfersService.dispatch(req.params.id as string, userId);
      res.status(200).json({ success: true, data: transfer });
    } catch (error) { next(error); }
  },

  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const transfer = await transfersService.receive(req.params.id as string, userId);
      res.status(200).json({ success: true, data: transfer });
    } catch (error) { next(error); }
  },
};
