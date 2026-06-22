import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PlatformModule } from './modules/platform/platform.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { CustomerModule } from './modules/customer/customer.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    PrismaModule,
    PaymentModule,
    PlatformModule,
    MerchantModule,
    StorefrontModule,
    CustomerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
