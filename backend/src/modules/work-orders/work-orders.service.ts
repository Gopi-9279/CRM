import { prisma } from '../../db/prisma';
import { z } from 'zod';
import { NotFoundError, ConflictError, ForbiddenError } from '../../lib/errors';
import crypto from 'crypto';


export const createWorkOrderSchema = z.object({
  body: z.object({
    location_id: z.string().uuid(),
    item_id: z.string().uuid(),
    required_quantity: z.number().positive(),
    assigned_user_id: z.string().uuid(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED']),
  }),
});

export const workOrdersService = {
  async getAll(query: { status?: string; location_id?: string; assigned_user_id?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.location_id) where.location_id = query.location_id;
    if (query.assigned_user_id) where.assigned_user_id = query.assigned_user_id;

    return prisma.workOrder.findMany({
      where,
      include: {
        item: true,
        location: true,
        assigned_user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  async getById(id: string) {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        item: true,
        location: true,
        assigned_user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!wo) throw new NotFoundError('Work order not found');
    return wo;
  },

  async create(data: z.infer<typeof createWorkOrderSchema>['body'], creator_id: string) {
    // Validate assignee has OPERATIONS role
    const assignee = await prisma.user.findUnique({
      where: { id: data.assigned_user_id },
      include: { role: true },
    });

    if (!assignee) {
      throw new NotFoundError('Assigned user not found');
    }

    if (assignee.role.name !== 'OPERATIONS') {
      throw new ConflictError('INVALID_ASSIGNEE', 'Assigned user must have the OPERATIONS role');
    }

    return prisma.workOrder.create({
      data: {
        id: crypto.randomUUID(),
        location_id: data.location_id,
        item_id: data.item_id,
        required_quantity: data.required_quantity,
        assigned_user_id: data.assigned_user_id,
        created_by: creator_id,
        status: 'ASSIGNED',
      },
    });
  },

  async updateStatus(id: string, newStatus: string, currentUserId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Pessimistic lock
      const rows = await tx.$queryRaw<any[]>`
        SELECT * FROM work_orders
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;

      if (!rows || rows.length === 0) {
        throw new NotFoundError('Work order not found');
      }

      const wo = rows[0];

      // 2. Validate Assignee
      if (wo.assigned_user_id !== currentUserId) {
        throw new ForbiddenError('You are not assigned to this work order');
      }

      // 3. State machine transitions
      if (newStatus === 'IN_PROGRESS' && wo.status !== 'ASSIGNED') {
        throw new ConflictError('INVALID_STATUS_TRANSITION', 'Can only transition to IN_PROGRESS from ASSIGNED');
      }
      if (newStatus === 'COMPLETED' && wo.status !== 'IN_PROGRESS') {
        throw new ConflictError('INVALID_STATUS_TRANSITION', 'Can only transition to COMPLETED from IN_PROGRESS');
      }

      // 4. Update status
      return tx.workOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    });
  },

  async getStockCheck(id: string) {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: { item: true, location: true },
    });

    if (!wo) throw new NotFoundError('Work order not found');

    const inventoryRecords = await prisma.inventory.findMany({
      where: {
        item_id: wo.item_id,
        location_id: wo.location_id,
      },
    });

    const availableQuantity = inventoryRecords.reduce((acc, curr) => acc + Number(curr.available_quantity), 0);
    const requiredQuantity = Number(wo.required_quantity);
    const shortage = Math.max(0, requiredQuantity - availableQuantity);

    return {
      requiredQuantity,
      availableQuantity,
      shortage,
    };
  },
};
