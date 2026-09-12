const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const res = await prisma.$queryRaw`SELECT is_generated FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'available_quantity'`; 
  console.log('is_generated:', res[0]?.is_generated); 
  const inv = await prisma.inventory.findFirst();
  console.log('inv:', inv);
  prisma.$disconnect(); 
} 
run();
