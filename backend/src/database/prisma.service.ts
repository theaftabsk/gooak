import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as CentralPrismaClient } from '../generated/central';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends CentralPrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Create a standard PostgreSQL connection pool for Central DB
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Wrap it in Prisma's Driver Adapter
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to the CentralPrismaClient
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}