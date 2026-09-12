import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app'; // Wait, let's see if app is exported in app.ts
import { prisma } from '../setup';
import { signAccessToken } from '../../src/lib/jwt';

describe('Inventory Integration (T-01, T-06, T-07, T-08)', () => {
  let adminToken: string;
  let testItem: any;
  let testLocation: any;
  let testBatch: any;
  
  beforeAll(async () => {
    // 1. Get an admin token
    const admin = await prisma.user.findFirst({ where: { role_id: 1 } });
    if (!admin) throw new Error('No admin user found for tests');
    adminToken = signAccessToken({ userId: admin.id, role: admin.role_id === 1 ? 'ADMIN' : 'USER' });

    // 2. Create test location and item specifically for this suite to avoid pollution
    testLocation = await prisma.location.create({
      data: { id: crypto.randomUUID(), name: 'Test Warehouse ' + Date.now(), code: 'TEST_LOC_' + Date.now().toString().slice(-5) },
    });
    
    const category = await prisma.category.findFirst() || await prisma.category.create({
      data: { id: crypto.randomUUID(), name: 'Test Category' }
    });

    testItem = await prisma.item.create({
      data: { 
        id: crypto.randomUUID(),
        sku: 'TEST-SKU-' + Date.now(), 
        name: 'Test Item', 
        category: { connect: { id: category.id } },
      },
    });
    
    testBatch = await prisma.batch.findFirst({ where: { item_id: testItem.id }});
    if (!testBatch) {
      testBatch = await prisma.batch.create({
        data: {
          id: crypto.randomUUID(),
          batch_number: 'BATCH-1',
          item: { connect: { id: testItem.id } }
        }
      });
    }

    await prisma.inventory.create({
      data: {
        id: crypto.randomUUID(),
        item: { connect: { id: testItem.id } },
        location: { connect: { id: testLocation.id } },
        batch: { connect: { id: testBatch.id } },
        physical_quantity: 100,
        reserved_quantity: 0,
        // available_quantity is GENERATED ALWAYS AS (physical_quantity - reserved_quantity) STORED
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.reservation.deleteMany();
    await prisma.inventoryTransaction.deleteMany();
    await prisma.customerOrder.deleteMany();
    await prisma.inventory.deleteMany({ where: { location_id: testLocation.id } });
    await prisma.batch.deleteMany({ where: { item_id: testItem.id } });
    await prisma.item.delete({ where: { id: testItem.id } });
    await prisma.location.delete({ where: { id: testLocation.id } });
  });

  // Belongs to Phase 13 (Orders)
  it('T-01: Cannot reserve more than available (400 or 409)', async () => {
    // Attempt to create a customer order for 150 items
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_reference: 'Overbooker Corp',
        items: [
          { item_id: testItem.id, location_id: testLocation.id, batch_id: testBatch.id, quantity_requested: 150 }
        ]
      });
      
    expect(orderRes.status).toBe(201);
    const order = orderRes.body.data;
    const orderItemId = order.items[0].id;

    // Now try to reserve it
    const res = await request(app)
      .post(`/api/v1/orders/${order.id}/reserve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ order_item_id: orderItemId });
    
    // The backend should return an error because available is 100
    expect(res.status).toBe(409); 
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toContain('Insufficient stock');
  });

  it('T-08: Negative inventory rejected via check constraints', async () => {
    // Attempt manual patch to set quantity negative
    const inventory = await prisma.inventory.findFirst({
      where: { item_id: testItem.id, location_id: testLocation.id }
    });

    const res = await request(app)
      .patch(`/api/v1/inventory/${inventory!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        quantity_change: -150, // Physical is 100, so this would make it -50
        reason: 'Test negative check'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  // Belongs to Phase 13 (Orders)
  it('T-06: Concurrent reservations cannot jointly oversell', async () => {
    // We have 100 available. We fire three concurrent requests, each asking for 40.
    // Only two should succeed (80 total). The third (40) should fail because 100 < 80 + 40.
    const createOrderParams = {
      customer_reference: 'Concurrent Corp',
      items: [
        { item_id: testItem.id, location_id: testLocation.id, batch_id: testBatch.id, quantity_requested: 40 }
      ]
    };

    const orderRes1 = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${adminToken}`).send(createOrderParams);
    const orderRes2 = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${adminToken}`).send(createOrderParams);
    const orderRes3 = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${adminToken}`).send(createOrderParams);

    const order1 = orderRes1.body.data;
    const order2 = orderRes2.body.data;
    const order3 = orderRes3.body.data;

    const req1 = request(app).post(`/api/v1/orders/${order1.id}/reserve`).set('Authorization', `Bearer ${adminToken}`).send({ order_item_id: order1.items[0].id });
    const req2 = request(app).post(`/api/v1/orders/${order2.id}/reserve`).set('Authorization', `Bearer ${adminToken}`).send({ order_item_id: order2.items[0].id });
    const req3 = request(app).post(`/api/v1/orders/${order3.id}/reserve`).set('Authorization', `Bearer ${adminToken}`).send({ order_item_id: order3.items[0].id });

    const responses = await Promise.all([req1, req2, req3]);
    
    const successes = responses.filter(r => r.status === 200);
    const failures = responses.filter(r => r.status === 409);

    // Exactly 2 succeed, 1 fails
    expect(successes.length).toBe(2);
    expect(failures.length).toBe(1);

    // Check T-07: Available equals physical - reserved
    const inv = await prisma.inventory.findFirst({
      where: { item_id: testItem.id, location_id: testLocation.id }
    });

    expect(Number(inv?.physical_quantity)).toBe(100);
    expect(Number(inv?.reserved_quantity)).toBe(80); // 40 + 40
    expect(Number(inv?.available_quantity)).toBe(20);
  });
});
