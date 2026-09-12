import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  }),
});

export const categoriesService = {
  async getAll() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  async create(data: z.infer<typeof createCategorySchema>['body']) {
    return prisma.category.create({ data: { id: crypto.randomUUID(), ...data } });
  },
};
