import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as TenantPrismaClient } from '../generated/tenant';

@Injectable()
export class TenantConnectionPoolService implements OnModuleDestroy {
  private clients: Map<string, TenantPrismaClient> = new Map();
  private pools: Map<string, Pool> = new Map();

  getTenantClient(connectionString: string): TenantPrismaClient {
    if (this.clients.has(connectionString)) {
      return this.clients.get(connectionString)!;
    }

    // Create a connection pool specific to this tenant
    const pool = new Pool({
      connectionString,
      max: 10, // Max active connections per tenant database
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const adapter = new PrismaPg(pool);
    const client = new TenantPrismaClient({ adapter });

    this.pools.set(connectionString, pool);
    this.clients.set(connectionString, client);

    return client;
  }

  async provisionTenantDatabase(connectionUrl: string): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Run prisma db push programmatically for tenant schema
      await execAsync(`npx prisma db push --schema=prisma/tenant.prisma --accept-data-loss`, {
        env: {
          ...process.env,
          DATABASE_URL: connectionUrl,
        },
      });
    } catch (error) {
      console.error(`Failed to provision database at ${connectionUrl}:`, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // Gracefully clean up all active connections
    for (const client of this.clients.values()) {
      await client.$disconnect();
    }
    for (const pool of this.pools.values()) {
      await pool.end();
    }
    this.clients.clear();
    this.pools.clear();
  }
}
