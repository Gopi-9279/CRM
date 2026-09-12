import { prisma } from '../../db/prisma';
import { z } from 'zod';
import crypto from 'crypto';


export const createBatchSchema = z.object({
  body: z.object({
    item_id: z.string().uuid(),
    batch_number: z.string().min(1, 'Batch number is required'),
    expiry_date: z.string().datetime().optional(),
  }),
});

export const batchesService = {
  async getAll(query: { item_id?: string }) {
    const where: any = {};
    if (query.item_id) where.item_id = query.item_id;

    return prisma.batch.findMany({
      where,
      include: { item: true },
      orderBy: { created_at: 'desc' },
    });
  },

  async create(data: z.infer<typeof createBatchSchema>['body']) {
    return prisma.batch.create({
      data: {
        id: crypto.randomUUID(),
        item_id: data.item_id,
        batch_number: data.batch_number,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
      },
      include: { item: true },
    });
  },
};
