import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export const usersController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id as string);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
};
