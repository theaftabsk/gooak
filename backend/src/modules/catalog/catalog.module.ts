import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { PlatformAdminController } from './platform-admin.controller';
import { CatalogService } from './catalog.service';
import { PrismaModule } from '../../database/prisma.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [CatalogController, PlatformAdminController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
