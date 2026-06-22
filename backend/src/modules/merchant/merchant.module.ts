import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MerchantController, InventoryController, ReviewsController],
  providers: [MerchantService, InventoryService, ReviewsService],
  exports: [MerchantService],
})
export class MerchantModule {}
