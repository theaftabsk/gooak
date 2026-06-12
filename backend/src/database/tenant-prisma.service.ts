import { Injectable } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';
import { tenantLocalStorage } from './tenant-context';

@Injectable()
export class TenantPrismaService {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        // If prop is accessed on Target class itself, return it
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        // Avoid throwing errors for standard framework checks, symbols, and lifecycle hooks
        if (
          typeof prop === 'symbol' ||
          prop === 'then' ||
          prop === 'inspect' ||
          prop === 'toString' ||
          prop === 'valueOf' ||
          prop === 'constructor' ||
          prop === 'onModuleInit' ||
          prop === 'onModuleDestroy' ||
          prop === 'onApplicationBootstrap' ||
          prop === 'onApplicationShutdown'
        ) {
          return undefined;
        }

        // Delegate database calls to the current tenant's client
        const store = tenantLocalStorage.getStore();
        if (!store) {
          throw new Error(
            `Tenant context not initialized. Cannot access database property "${String(prop)}" outside of a tenant request context.`
          );
        }

        const client = store.client;
        const value = Reflect.get(client, prop);
        if (typeof value === 'function') {
          return value.bind(client);
        }
        return value;
      },
    });
  }
}

// Add TypeScript declaration merging so injection is fully typed as a TenantPrismaClient
export interface TenantPrismaService extends TenantPrismaClient {}
