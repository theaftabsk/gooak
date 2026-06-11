import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to DATABASE_URL:', connectionString ? connectionString.substring(0, 40) + '...' : 'undefined');

  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env');
    return;
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    const count = await prisma.shop.count();
    const reqCount = await prisma.tenantRequest.count();
    console.log('Successfully connected and queried database! Total shops count:', count, 'Tenant requests count:', reqCount);
    
    const shops = await prisma.shop.findMany({ select: { name: true, slug: true } });
    console.log('Shops in database:', shops);
    
    const requests = await prisma.tenantRequest.findMany();
    console.log('Tenant Requests in database:', requests);
  } catch (err) {
    console.error('Database query failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
