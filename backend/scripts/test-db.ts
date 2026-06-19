import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

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
