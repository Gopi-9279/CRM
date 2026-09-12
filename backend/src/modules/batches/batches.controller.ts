import { Request, Response, NextFunction } from 'express';
import { batchesService } from './batches.service';

export const batchesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const batches = await batchesService.getAll({
        item_id: req.query.item_id as string,
      });
      res.status(200).json({ success: true, data: batches });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await batchesService.create(req.body);
      res.status(201).json({ success: true, data: batch });
    } catch (error) { next(error); }
  },
};
