import { prisma } from '../../db/prisma';
import { z } from 'zod';
import { NotFoundError } from '../../lib/errors';
import crypto from 'crypto';


export const createItemSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    category_id: z.string().uuid(),
    unit_of_measure: z.string().min(1, 'UOM is required'),
  }),
});

export const updateItemSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    category_id: z.string().uuid().optional(),
    unit_of_measure: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const itemsService = {
  async getAll(query: { category_id?: string; search?: string }) {
    const where: any = {};
    if (query.category_id) where.category_id = query.category_id;
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    return prisma.item.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) throw new NotFoundError('Item not found');
    return item;
  },

  async create(data: z.infer<typeof createItemSchema>['body']) {
    // Auto-create DEFAULT batch on item creation
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.create({ data: { id: crypto.randomUUID(), ...data } });
      
      await tx.batch.create({
        data: {
          id: crypto.randomUUID(),
          item_id: item.id,
          batch_number: 'DEFAULT',
        },
      });

      return item;
    });
  },

  async update(id: string, data: z.infer<typeof updateItemSchema>['body']) {
    const exists = await prisma.item.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Item not found');

    return prisma.item.update({ where: { id }, data });
  },
};
