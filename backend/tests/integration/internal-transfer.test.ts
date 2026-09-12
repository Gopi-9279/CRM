import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../setup';
import { signAccessToken } from '../../src/lib/jwt';

describe('Internal Transfer Integration (T-02, T-03, T-04, T-13)', () => {
  let adminToken: string;
  let testItem: any;
  let sourceLoc: any;
  let destLoc: any;
  let testBatch: any;
  
  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role_id: 1 } });
    if (!admin) throw new Error('No admin user found for tests');
    adminToken = signAccessToken({ userId: admin.id, role: admin.role_id === 1 ? 'ADMIN' : 'USER' });

    sourceLoc = await prisma.location.create({ data: { id: crypto.randomUUID(), name: 'Source Loc', code: 'SRC_' + Date.now() } });
    destLoc = await prisma.location.create({ data: { id: crypto.randomUUID(), name: 'Dest Loc', code: 'DST_' + Date.now() } });
    
    const category = await prisma.category.findFirst() || await prisma.category.create({ data: { id: crypto.randomUUID(), name: 'Cat' } });
    testItem = await prisma.item.create({ data: { id: crypto.randomUUID(), sku: 'TRF-SKU-' + Date.now(), name: 'Item', category: { connect: { id: category.id } } } });

    testBatch = await prisma.batch.findFirst({ where: { item_id: testItem.id }});
    if (!testBatch) {
      testBatch = await prisma.batch.create({
        data: { id: crypto.randomUUID(), batch_number: 'BATCH-1', item: { connect: { id: testItem.id } } }
      });
    }

    // Source has 100, Dest has 0
    await prisma.inventory.create({ data: { id: crypto.randomUUID(), item: { connect: { id: testItem.id } }, location: { connect: { id: sourceLoc.id } }, batch: { connect: { id: testBatch.id } }, physical_quantity: 100, reserved_quantity: 0 } });
    await prisma.inventory.create({ data: { id: crypto.randomUUID(), item: { connect: { id: testItem.id } }, location: { connect: { id: destLoc.id } }, batch: { connect: { id: testBatch.id } }, physical_quantity: 0, reserved_quantity: 0 } });
  });

  afterAll(async () => {
    const testInventories = await prisma.inventory.findMany({ where: { item_id: testItem.id }});
    const testInventoryIds = testInventories.map(i => i.id);
    await prisma.inventoryTransaction.deleteMany({ where: { inventory_id: { in: testInventoryIds } } });
    await prisma.internalTransfer.deleteMany({ where: { item_id: testItem.id } });
    await prisma.inventory.deleteMany({ where: { item_id: testItem.id } });
    await prisma.item.delete({ where: { id: testItem.id } });
    await prisma.location.delete({ where: { id: sourceLoc.id } });
    await prisma.location.delete({ where: { id: destLoc.id } });
  });

  it('T-13: Transfer source != destination enforced', async () => {
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        source_location_id: sourceLoc.id,
        destination_location_id: sourceLoc.id, // SAME!
        item_id: testItem.id,
        batch_id: testBatch.id,
        quantity: 10
      });
    
    expect(res.status).toBe(409); // Conflict
  });

  it('T-02: Cannot transfer more than available', async () => {
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        source_location_id: sourceLoc.id,
        destination_location_id: destLoc.id,
        item_id: testItem.id,
        batch_id: testBatch.id,
        quantity: 150 // We only have 100!
      });
    
    expect(res.status).toBe(409);
  });

  it('T-03: Destination increases only after receipt', async () => {
    // 1. Create Transfer for 20
    const createRes = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        source_location_id: sourceLoc.id,
        destination_location_id: destLoc.id,
        item_id: testItem.id,
        batch_id: testBatch.id,
        quantity: 20
      });
    expect(createRes.status).toBe(201);
    const transferId = createRes.body.data.id;

    // 2. Check quantities (Source phys: 80, Dest phys: 0)
    let srcInv = await prisma.inventory.findFirst({ where: { location_id: sourceLoc.id, item_id: testItem.id }});
    let destInv = await prisma.inventory.findFirst({ where: { location_id: destLoc.id, item_id: testItem.id }});
    expect(Number(srcInv?.physical_quantity)).toBe(100); // No change upon creation
    expect(Number(destInv?.physical_quantity)).toBe(0);

    // 3. Mark as DISPATCHED (no inventory change)
    await request(app).patch(`/api/v1/transfers/${transferId}/dispatch`).set('Authorization', `Bearer ${adminToken}`).send();

    // 4. Mark as COMPLETED (Dest increases by 20)
    const completeRes = await request(app).patch(`/api/v1/transfers/${transferId}/receive`).set('Authorization', `Bearer ${adminToken}`).send();
    expect(completeRes.status).toBe(200);

    srcInv = await prisma.inventory.findFirst({ where: { location_id: sourceLoc.id, item_id: testItem.id }});
    destInv = await prisma.inventory.findFirst({ where: { location_id: destLoc.id, item_id: testItem.id }});
    expect(Number(srcInv?.physical_quantity)).toBe(80); // Decreased by 20 on dispatch
    expect(Number(destInv?.physical_quantity)).toBe(20); // Increased by 20 on complete
  });

  it('T-04: Same transfer cannot be received twice', async () => {
    // We already completed the transfer in T-03.
    // Try to complete it again.
    const transfer = await prisma.internalTransfer.findFirst({
      where: { item_id: testItem.id, status: 'RECEIVED' }
    });

    const res = await request(app)
      .patch(`/api/v1/transfers/${transfer!.id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    // Assuming the state machine throws a 409 (Conflict) for invalid transitions
    expect(res.status).toBe(409); 
  });
});
