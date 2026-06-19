import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';

/**
 * TenantConnectionPoolService manages dynamic PostgreSQL connection pools and
 * Prisma Client instances for each database tenant. It acts as a cache layer
 * to prevent database connection leakage.
 */
@Injectable()
export class TenantConnectionPoolService implements OnModuleDestroy {
  // Map caching database connection strings to their corresponding Prisma client instance
  private clients: Map<string, TenantPrismaClient> = new Map();
  // Map caching connection strings to their raw pg Pool instances
  private pools: Map<string, Pool> = new Map();

  /**
   * Retrieves or instantiates a PrismaClient for the given connection string.
   * If already cached, it immediately returns the existing client for high performance.
   */
  getTenantClient(connectionString: string): TenantPrismaClient {
    if (this.clients.has(connectionString)) {
      return this.clients.get(connectionString)!;
    }

    // Create a connection pool specific to this tenant database
    const pool = new Pool({
      connectionString,
      max: 10, // Limit max active connections per tenant database to prevent database overload
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Connection timeout of 5 seconds
    });

    const adapter = new PrismaPg(pool);
    const client = new TenantPrismaClient({ adapter });

    this.pools.set(connectionString, pool);
    this.clients.set(connectionString, client);

    return client;
  }

  /**
   * Programmatically provisions a new tenant database by applying the tenant schema.
   * This is executed when a new merchant/shop is registered on the platform.
   */
  async provisionTenantDatabase(connectionUrl: string): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Run prisma db push programmatically targeting the new tenant's database URL
      await execAsync(
        `npx prisma db push --schema=prisma/tenant.prisma --accept-data-loss`,
        {
          env: {
            ...process.env,
            DATABASE_URL: connectionUrl,
          },
        },
      );
    } catch (error) {
      console.error(`Failed to provision database at ${connectionUrl}:`, error);
      throw error;
    }
  }

  /**
   * Clean up all active clients and connection pools when the NestJS module is destroyed
   * (e.g. during application shutdown).
   */
  async onModuleDestroy() {
    // Gracefully disconnect all Prisma client instances
    for (const client of this.clients.values()) {
      await client.$disconnect();
    }
    // End all PostgreSQL connection pools
    for (const pool of this.pools.values()) {
      await pool.end();
    }
    this.clients.clear();
    this.pools.clear();
  }
}
