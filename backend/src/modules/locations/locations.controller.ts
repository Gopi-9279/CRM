import { Request, Response, NextFunction } from 'express';
import { locationsService } from './locations.service';

export const locationsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await locationsService.getAll();
      res.status(200).json({ success: true, data: locations });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationsService.getById(req.params.id as string);
      res.status(200).json({ success: true, data: location });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationsService.create(req.body);
      res.status(201).json({ success: true, data: location });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationsService.update(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: location });
    } catch (error) { next(error); }
  },
};
