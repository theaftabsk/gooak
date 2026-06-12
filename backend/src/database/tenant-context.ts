import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  client: TenantPrismaClient;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantContext>();
