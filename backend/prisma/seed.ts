import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { id: 1, name: 'ADMIN' } }),
    prisma.role.upsert({ where: { name: 'OPERATIONS' }, update: {}, create: { id: 2, name: 'OPERATIONS' } }),
    prisma.role.upsert({ where: { name: 'SALES' }, update: {}, create: { id: 3, name: 'SALES' } })
  ]);
  console.log('Roles created.');

  // 2. Locations
  const locationA = await prisma.location.upsert({
    where: { code: 'WH-A' },
    update: {},
    create: { id: '7bb56c28-97c7-43db-b035-77cf8d132b49', code: 'WH-A', name: 'Warehouse A' }
  });
  const locationB = await prisma.location.upsert({
    where: { code: 'WH-B' },
    update: {},
    create: { id: '3cc66c28-97c7-43db-b035-77cf8d132b50', code: 'WH-B', name: 'Warehouse B' }
  });
  console.log('Locations created.');

  // 3. Users
  const passwordHash = await bcrypt.hash('password123', 12);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: { name: 'Alice Admin', email: 'admin@demo.com', password_hash: passwordHash, role_id: 1, location_id: locationA.id }
    }),
    prisma.user.upsert({
      where: { email: 'ops@demo.com' },
      update: {},
      create: { name: 'Bob Ops', email: 'ops@demo.com', password_hash: passwordHash, role_id: 2, location_id: locationA.id }
    }),
    prisma.user.upsert({
      where: { email: 'sales@demo.com' },
      update: {},
      create: { name: 'Charlie Sales', email: 'sales@demo.com', password_hash: passwordHash, role_id: 3, location_id: locationB.id }
    })
  ]);
  console.log('Users created.');

  // 4. Categories
  const catRaw = await prisma.category.upsert({
    where: { name: 'Raw Materials' }, update: {}, create: { id: 'd0c56c28-97c7-43db-b035-77cf8d132b51', name: 'Raw Materials' }
  });
  const catPackaging = await prisma.category.upsert({
    where: { name: 'Packaging' }, update: {}, create: { id: 'e1d66c28-97c7-43db-b035-77cf8d132b52', name: 'Packaging' }
  });
  const catFinished = await prisma.category.upsert({
    where: { name: 'Finished Goods' }, update: {}, create: { id: 'f2e76c28-97c7-43db-b035-77cf8d132b53', name: 'Finished Goods' }
  });
  console.log('Categories created.');

  // 5. Items and Default Batches
  const itemsData = [
    { id: '11111111-1111-1111-1111-111111111111', sku: 'RM-STEEL', name: 'Steel Sheet', category_id: catRaw.id, unit_of_measure: 'KG', allow_fractional: true },
    { id: '22222222-2222-2222-2222-222222222222', sku: 'RM-PAINT', name: 'Blue Paint', category_id: catRaw.id, unit_of_measure: 'L', allow_fractional: true },
    { id: '33333333-3333-3333-3333-333333333333', sku: 'PKG-BOX', name: 'Standard Box', category_id: catPackaging.id, unit_of_measure: 'EA', allow_fractional: false },
    { id: '44444444-4444-4444-4444-444444444444', sku: 'FG-WIDGET-A', name: 'Widget Model A', category_id: catFinished.id, unit_of_measure: 'EA', allow_fractional: false },
    { id: '55555555-5555-5555-5555-555555555555', sku: 'FG-WIDGET-B', name: 'Widget Model B', category_id: catFinished.id, unit_of_measure: 'EA', allow_fractional: false }
  ];

  for (const item of itemsData) {
    await prisma.item.upsert({ where: { sku: item.sku }, update: {}, create: item });
    await prisma.batch.upsert({
      where: { item_id_batch_number: { item_id: item.id, batch_number: 'DEFAULT' } },
      update: {},
      create: { id: `b0000000-0000-0000-0000-${item.id.split('-')[4]}`, item_id: item.id, batch_number: 'DEFAULT' }
    });
  }
  console.log('Items & Default Batches created.');

  // 6. Inventory Initial Stock
  const inventorySetup = [
    { id: 'a1111111-1111-1111-1111-111111111111', item_id: itemsData[0].id, location_id: locationA.id, batch_id: `b0000000-0000-0000-0000-${itemsData[0].id.split('-')[4]}`, qty: 500 },
    { id: 'a2222222-2222-2222-2222-222222222222', item_id: itemsData[1].id, location_id: locationA.id, batch_id: `b0000000-0000-0000-0000-${itemsData[1].id.split('-')[4]}`, qty: 100 },
    { id: 'a3333333-3333-3333-3333-333333333333', item_id: itemsData[2].id, location_id: locationA.id, batch_id: `b0000000-0000-0000-0000-${itemsData[2].id.split('-')[4]}`, qty: 1000 },
    { id: 'a4444444-4444-4444-4444-444444444444', item_id: itemsData[3].id, location_id: locationB.id, batch_id: `b0000000-0000-0000-0000-${itemsData[3].id.split('-')[4]}`, qty: 50 },
    { id: 'a5555555-5555-5555-5555-555555555555', item_id: itemsData[4].id, location_id: locationB.id, batch_id: `b0000000-0000-0000-0000-${itemsData[4].id.split('-')[4]}`, qty: 25 }
  ];

  for (const inv of inventorySetup) {
    const existing = await prisma.inventory.findUnique({
      where: { item_id_location_id_batch_id: { item_id: inv.item_id, location_id: inv.location_id, batch_id: inv.batch_id } }
    });
    if (!existing) {
      await prisma.inventory.create({
        data: {
          id: inv.id,
          item_id: inv.item_id,
          location_id: inv.location_id,
          batch_id: inv.batch_id,
          physical_quantity: inv.qty,
          reserved_quantity: 0
        }
      });
      // Add audit log
      await prisma.inventoryTransaction.create({
        data: {
          id: `c0000000-0000-0000-0000-${inv.id.split('-')[4]}`,
          inventory_id: inv.id,
          transaction_type: 'RECEIPT',
          quantity_change: inv.qty,
          physical_before: 0,
          physical_after: inv.qty,
          reserved_before: 0,
          reserved_after: 0,
          reference_type: 'MANUAL',
          performed_by: users[1].id,
          idempotency_key: `seed-init-${inv.id}`
        }
      });
    }
  }
  console.log('Initial Inventory stocked.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
