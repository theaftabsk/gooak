import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CustomerModule } from './modules/customer/customer.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    PrismaModule,
    PaymentModule,
    CatalogModule,
    CustomerModule,
    InventoryModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
