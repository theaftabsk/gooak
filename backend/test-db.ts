import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.shop.count();
    console.log('Successfully connected to DB! Total shops:', count);
  } catch (err) {
    console.error('Failed to connect to DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
