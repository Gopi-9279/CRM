import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError } from '../../lib/errors';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createLocationSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    address: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const locationsService = {
  async getAll() {
    return prisma.location.findMany({ orderBy: { name: 'asc' } });
  },

  async getById(id: string) {
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundError('Location not found');
    return location;
  },

  async create(data: z.infer<typeof createLocationSchema>['body']) {
    return prisma.location.create({ data: { id: crypto.randomUUID(), ...data } });
  },

  async update(id: string, data: z.infer<typeof updateLocationSchema>['body']) {
    const exists = await prisma.location.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Location not found');

    return prisma.location.update({ where: { id }, data });
  },
};
