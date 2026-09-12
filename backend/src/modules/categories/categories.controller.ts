import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';

export const categoriesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAll();
      res.status(200).json({ success: true, data: categories });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
  },
};
