import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ConflictError } from '../../lib/errors';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createInventorySchema = z.object({
  body: z.object({
    item_id: z.string().uuid(),
    location_id: z.string().uuid(),
    batch_id: z.string().uuid(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    quantity_change: z.number(),
    transaction_type: z.enum(['RECEIPT', 'ADJUSTMENT', 'ISSUE']),
    reference_type: z.string().optional(),
    reference_id: z.string().uuid().optional(),
    idempotency_key: z.string().optional(),
  }),
});

export const inventoryService = {
  async getAll(query: { location_id?: string; category_id?: string }) {
    const where: any = {};
    if (query.location_id) where.location_id = query.location_id;
    if (query.category_id) where.item = { category_id: query.category_id };

    return prisma.inventory.findMany({
      where,
      include: {
        item: true,
        location: true,
        batch: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  },

  async getById(id: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { item: true, location: true, batch: true },
    });
    if (!inventory) throw new NotFoundError('Inventory record not found');
    return inventory;
  },

  async getTransactions(inventory_id: string) {
    return prisma.inventoryTransaction.findMany({
      where: { inventory_id },
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  async create(data: z.infer<typeof createInventorySchema>['body']) {
    return prisma.inventory.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
      },
      include: { item: true, location: true, batch: true },
    });
  },

  async adjustStock(
    id: string,
    data: z.infer<typeof adjustStockSchema>['body'],
    user_id: string
  ) {
    // Check idempotency first without locking to fail fast if already processed
    if (data.idempotency_key) {
      const existingTx = await prisma.inventoryTransaction.findUnique({
        where: { idempotency_key: data.idempotency_key },
      });
      if (existingTx) {
        return prisma.inventory.findUnique({
          where: { id },
          include: { item: true, location: true, batch: true },
        });
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Pessimistic lock on the inventory row
      const rows = await tx.$queryRaw<any[]>`
        SELECT * FROM inventory
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;

      if (!rows || rows.length === 0) {
        throw new NotFoundError('Inventory record not found');
      }

      const inv = rows[0];

      // 2. Calculate new physical quantity
      const quantity_change = Number(data.quantity_change);
      const physical_before = Number(inv.physical_quantity);
      const physical_after = physical_before + quantity_change;

      if (physical_after < 0) {
        throw new ConflictError('INSUFFICIENT_STOCK', 'Insufficient stock for this operation');
      }

      // 3. Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id },
        data: {
          physical_quantity: physical_after,
        },
        include: { item: true, location: true, batch: true },
      });

      // 4. Create transaction log
      await tx.inventoryTransaction.create({
        data: {
          id: crypto.randomUUID(),
          inventory_id: id,
          transaction_type: data.transaction_type,
          quantity_change: quantity_change,
          physical_before: physical_before,
          physical_after: physical_after,
          reserved_before: Number(inv.reserved_quantity),
          reserved_after: Number(inv.reserved_quantity),
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          idempotency_key: data.idempotency_key,
          performed_by: user_id,
        },
      });

      return updatedInventory;
    });
  },
};
