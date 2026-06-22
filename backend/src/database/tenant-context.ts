import { AsyncLocalStorage } from 'async_hooks';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  client: TenantPrismaClient;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantContext>();

// Single shared tenant Prisma client — all shops live in the same database.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const tenantPrismaClient = new TenantPrismaClient({ adapter });
