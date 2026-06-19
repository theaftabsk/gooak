/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';
import { tenantLocalStorage } from './tenant-context';

/**
 * TenantPrismaService is a dynamic client proxy.
 * Instead of injecting a static database connection, NestJS modules inject this service.
 * Any property accessed on this service is dynamically delegated to the active tenant's
 * Prisma Client retrieved from AsyncLocalStorage (tenantLocalStorage).
 */
@Injectable()
export class TenantPrismaService {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        // If the property exists directly on the target (TenantPrismaService class itself), return it.
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        // Avoid throwing errors for standard framework checks, symbols, and NestJS lifecycle hooks.
        // During bootstrap, NestJS inspects dependencies; we must bypass proxy delegation for these.
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

        // Retrieve the AsyncLocalStorage store bound to the current request lifecycle.
        const store = tenantLocalStorage.getStore();
        if (!store) {
          throw new Error(
            `Tenant context not initialized. Cannot access database property "${String(prop)}" outside of a tenant request context.`,
          );
        }

        const client = store.client;
        const value = Reflect.get(client, prop);

        // If the property is a database action function (e.g. findMany, create, update), bind it to the client instance.
        if (typeof value === 'function') {
          return value.bind(client);
        }
        return value;
      },
    });
  }
}

// Add TypeScript declaration merging so injection is fully typed as a TenantPrismaClient
// This allows developers to get autocomplete and type checking as if they were using PrismaClient directly.
export interface TenantPrismaService extends TenantPrismaClient {}
