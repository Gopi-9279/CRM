import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ConflictError } from '../../lib/errors';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createTransferSchema = z.object({
  body: z.object({
    source_location_id: z.string().uuid(),
    destination_location_id: z.string().uuid(),
    item_id: z.string().uuid(),
    batch_id: z.string().uuid(),
    quantity: z.number().positive(),
  }),
});

export const transfersService = {
  async getAll(query: { status?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;

    return prisma.internalTransfer.findMany({
      where,
      include: {
        item: true,
        batch: true,
        source_location: true,
        destination_location: true,
      },
      orderBy: { created_at: 'desc' },
    });
  },

  async create(data: z.infer<typeof createTransferSchema>['body'], userId: string) {
    if (data.source_location_id === data.destination_location_id) {
      throw new ConflictError('INVALID_TRANSFER', 'Source and destination locations must be different');
    }

    const sourceInv = await prisma.inventory.findUnique({
      where: {
        item_id_location_id_batch_id: {
          item_id: data.item_id,
          location_id: data.source_location_id,
          batch_id: data.batch_id,
        },
      },
    });

    if (!sourceInv || Number(sourceInv.available_quantity) < data.quantity) {
      throw new ConflictError('INSUFFICIENT_STOCK', 'Insufficient available stock at source location');
    }

    return prisma.internalTransfer.create({
      data: {
        id: crypto.randomUUID(),
        source_location_id: data.source_location_id,
        destination_location_id: data.destination_location_id,
        item_id: data.item_id,
        batch_id: data.batch_id,
        quantity: data.quantity,
        requested_by: userId,
        status: 'REQUESTED',
      },
    });
  },

  async dispatch(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transferRows = await tx.$queryRaw<any[]>`
        SELECT * FROM internal_transfers
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;
      if (!transferRows || transferRows.length === 0) throw new NotFoundError('Transfer not found');
      const transfer = transferRows[0];

      if (transfer.status !== 'REQUESTED') {
        throw new ConflictError('INVALID_STATUS_TRANSITION', 'Transfer must be in REQUESTED status to dispatch');
      }

      const invRows = await tx.$queryRaw<any[]>`
        SELECT * FROM inventory
        WHERE item_id = ${transfer.item_id}::uuid
          AND location_id = ${transfer.source_location_id}::uuid
          AND batch_id = ${transfer.batch_id}::uuid
        FOR UPDATE
      `;
      if (!invRows || invRows.length === 0) throw new NotFoundError('Source inventory not found');
      const inv = invRows[0];

      const physical_before = Number(inv.physical_quantity);
      const quantity = Number(transfer.quantity);
      const physical_after = physical_before - quantity;

      if (physical_after < 0) {
        throw new ConflictError('INSUFFICIENT_STOCK', 'Insufficient physical stock to dispatch');
      }

      await tx.inventory.update({
        where: { id: inv.id },
        data: { physical_quantity: physical_after },
      });

      const updatedTransfer = await tx.internalTransfer.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          dispatched_by: userId,
          dispatched_at: new Date(),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          id: crypto.randomUUID(),
          inventory_id: inv.id,
          transaction_type: 'TRANSFER_OUT',
          quantity_change: -quantity,
          physical_before,
          physical_after,
          reserved_before: Number(inv.reserved_quantity),
          reserved_after: Number(inv.reserved_quantity),
          reference_type: 'INTERNAL_TRANSFER',
          reference_id: id,
          performed_by: userId,
        },
      });

      return updatedTransfer;
    });
  },

  async receive(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transferRows = await tx.$queryRaw<any[]>`
        SELECT * FROM internal_transfers
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;
      if (!transferRows || transferRows.length === 0) throw new NotFoundError('Transfer not found');
      const transfer = transferRows[0];

      if (transfer.status === 'RECEIVED') {
        throw new ConflictError('TRANSFER_ALREADY_RECEIVED', 'Transfer has already been received');
      }
      if (transfer.status !== 'DISPATCHED') {
        throw new ConflictError('INVALID_STATUS_TRANSITION', 'Transfer must be DISPATCHED before receiving');
      }

      const quantity = Number(transfer.quantity);

      let destInv = await tx.inventory.findUnique({
        where: {
          item_id_location_id_batch_id: {
            item_id: transfer.item_id,
            location_id: transfer.destination_location_id,
            batch_id: transfer.batch_id,
          },
        },
      });

      if (!destInv) {
        destInv = await tx.inventory.create({
          data: {
            id: crypto.randomUUID(),
            item_id: transfer.item_id,
            location_id: transfer.destination_location_id,
            batch_id: transfer.batch_id,
            physical_quantity: 0,
          },
        });
      }

      const destRows = await tx.$queryRaw<any[]>`
        SELECT * FROM inventory
        WHERE id = ${destInv.id}::uuid
        FOR UPDATE
      `;
      const lockedDest = destRows[0];

      const physical_before = Number(lockedDest.physical_quantity);
      const physical_after = physical_before + quantity;

      await tx.inventory.update({
        where: { id: lockedDest.id },
        data: { physical_quantity: physical_after },
      });

      const updatedTransfer = await tx.internalTransfer.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          received_by: userId,
          received_at: new Date(),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          id: crypto.randomUUID(),
          inventory_id: lockedDest.id,
          transaction_type: 'TRANSFER_IN',
          quantity_change: quantity,
          physical_before,
          physical_after,
          reserved_before: Number(lockedDest.reserved_quantity),
          reserved_after: Number(lockedDest.reserved_quantity),
          reference_type: 'INTERNAL_TRANSFER',
          reference_id: id,
          performed_by: userId,
        },
      });

      return updatedTransfer;
    });
  },
};
