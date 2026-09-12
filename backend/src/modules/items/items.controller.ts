import { Request, Response, NextFunction } from 'express';
import { itemsService } from './items.service';

export const itemsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await itemsService.getAll({
        category_id: req.query.category_id as string,
        search: req.query.search as string,
      });
      res.status(200).json({ success: true, data: items });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemsService.getById(req.params.id as string);
      res.status(200).json({ success: true, data: item });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemsService.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemsService.update(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (error) { next(error); }
  },
};
