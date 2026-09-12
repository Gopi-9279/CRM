import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';

export const inventoryController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.getAll({
        location_id: req.query.location_id as string,
        category_id: req.query.category_id as string,
      });
      res.status(200).json({ success: true, data: inventory });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.getById(req.params.id as string);
      res.status(200).json({ success: true, data: inventory });
    } catch (error) { next(error); }
  },

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const txs = await inventoryService.getTransactions(req.params.id as string);
      res.status(200).json({ success: true, data: txs });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.create(req.body);
      res.status(201).json({ success: true, data: inventory });
    } catch (error) { next(error); }
  },

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const inventory = await inventoryService.adjustStock(req.params.id as string, req.body, userId);
      res.status(200).json({ success: true, data: inventory });
    } catch (error) { next(error); }
  },
};
