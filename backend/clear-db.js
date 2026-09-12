const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearData() {
  console.log('Clearing data...');
  // Delete in order to respect foreign keys
  await prisma.inventoryTransaction.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.customerOrderItem.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.internalTransfer.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.item.deleteMany();
  // We can keep categories, locations, users, roles as they have valid UUIDs
  console.log('Data cleared.');
}

clearData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
