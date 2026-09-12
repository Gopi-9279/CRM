import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ConflictError } from '../../lib/errors';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createOrderSchema = z.object({
  body: z.object({
    customer_reference: z.string().min(1, 'Customer reference is required'),
    items: z.array(z.object({
      item_id: z.string().uuid(),
      location_id: z.string().uuid(),
      batch_id: z.string().uuid(),
      quantity_requested: z.number().positive(),
    })).min(1, 'At least one item is required'),
  }),
});

export const reserveItemSchema = z.object({
  body: z.object({
    order_item_id: z.string().uuid(),
  }),
});

export const ordersService = {
  async getAll(query: { status?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;

    return prisma.customerOrder.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  async getById(id: string) {
    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        items: {
          include: {
            item: true,
            location: true,
            batch: true,
            reservation: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  },

  async create(data: z.infer<typeof createOrderSchema>['body'], userId: string) {
    const orderId = crypto.randomUUID();

    const orderItemsData = data.items.map(i => ({
      id: crypto.randomUUID(),
      item_id: i.item_id,
      location_id: i.location_id,
      batch_id: i.batch_id,
      quantity_requested: i.quantity_requested,
      status: 'PENDING',
    }));

    return prisma.customerOrder.create({
      data: {
        id: orderId,
        customer_reference: data.customer_reference,
        created_by: userId,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });
  },

  async reserveItem(orderId: string, orderItemId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch order item
      const orderItem = await tx.customerOrderItem.findUnique({
        where: { id: orderItemId },
      });

      if (!orderItem) throw new NotFoundError('Order item not found');
      if (orderItem.customer_order_id !== orderId) throw new ConflictError('INVALID_ORDER', 'Item does not belong to this order');
      if (orderItem.status === 'RESERVED') throw new ConflictError('ALREADY_RESERVED', 'Item is already reserved');

      // 2. Lock inventory row
      const invRows = await tx.$queryRaw<any[]>`
        SELECT * FROM inventory
        WHERE item_id = ${orderItem.item_id}::uuid
          AND location_id = ${orderItem.location_id}::uuid
          AND batch_id = ${orderItem.batch_id}::uuid
        FOR UPDATE
      `;

      if (!invRows || invRows.length === 0) {
        throw new NotFoundError('Inventory record not found for this item/location/batch combination');
      }

      const inv = invRows[0];
      const available_quantity = Number(inv.available_quantity);
      const requested = Number(orderItem.quantity_requested);

      // 3. Validate available >= requested
      if (available_quantity < requested) {
        throw new ConflictError('INSUFFICIENT_STOCK', `Insufficient stock. Available: ${available_quantity}, Requested: ${requested}`);
      }

      // 4. Increment reserved_quantity (available_quantity goes down due to PG GENERATED ALWAYS)
      const reserved_before = Number(inv.reserved_quantity);
      const reserved_after = reserved_before + requested;

      await tx.inventory.update({
        where: { id: inv.id },
        data: { reserved_quantity: reserved_after },
      });

      // 5. Insert reservation row
      await tx.reservation.create({
        data: {
          id: crypto.randomUUID(),
          customer_order_item_id: orderItem.id,
          inventory_id: inv.id,
          quantity: requested,
          status: 'ACTIVE',
        },
      });

      // 6. Write RESERVATION audit row
      await tx.inventoryTransaction.create({
        data: {
          id: crypto.randomUUID(),
          inventory_id: inv.id,
          transaction_type: 'RESERVATION',
          quantity_change: 0,
          physical_before: Number(inv.physical_quantity),
          physical_after: Number(inv.physical_quantity),
          reserved_before,
          reserved_after,
          reference_type: 'CUSTOMER_ORDER',
          reference_id: orderId,
          performed_by: userId,
        },
      });

      // 7. Update order item status
      await tx.customerOrderItem.update({
        where: { id: orderItem.id },
        data: { status: 'RESERVED' },
      });

      // 8. Update order header status
      const allItems = await tx.customerOrderItem.findMany({
        where: { customer_order_id: orderId },
      });

      const allReserved = allItems.every(i => i.id === orderItem.id || i.status === 'RESERVED');
      const anyReserved = allItems.some(i => i.id === orderItem.id || i.status === 'RESERVED');
      
      let orderStatus = 'PENDING';
      if (allReserved) orderStatus = 'RESERVED';
      else if (anyReserved) orderStatus = 'PARTIALLY_RESERVED';

      await tx.customerOrder.update({
        where: { id: orderId },
        data: { status: orderStatus },
      });

      return await tx.customerOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { reservation: true } } },
      });
    });
  },
};
