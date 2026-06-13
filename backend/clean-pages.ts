import { PrismaClient as CentralPrismaClient } from './src/generated/central';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new CentralPrismaClient({ adapter });

const RESERVED_SLUGS = [
  'index',
  'products',
  'category',
  'product',
  'cart',
  'checkout',
  'about',
  'contact',
  'privacy',
  'terms',
  'refund',
  'track-order'
];

async function main() {
  try {
    await prisma.$connect();
    const pages = await prisma.page.findMany();
    console.log('Current pages in database:', pages.map(p => ({ id: p.id, slug: p.slug, title: p.title })));
    
    const deleteResult = await prisma.page.deleteMany({
      where: {
        slug: {
          notIn: RESERVED_SLUGS
        }
      }
    });
    console.log('Deleted non-reserved custom pages:', deleteResult.count);

    const remainingPages = await prisma.page.findMany();
    console.log('Remaining pages in database:', remainingPages.map(p => ({ id: p.id, slug: p.slug, title: p.title })));
  } catch (err) {
    console.error('Error in cleanup:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
