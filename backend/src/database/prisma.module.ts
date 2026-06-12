import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantConnectionPoolService } from './tenant-connection-pool.service';
import { TenantPrismaService } from './tenant-prisma.service';

@Global()
@Module({
  providers: [PrismaService, TenantConnectionPoolService, TenantPrismaService],
  exports: [PrismaService, TenantConnectionPoolService, TenantPrismaService],
})
export class PrismaModule {}