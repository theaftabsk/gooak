import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { PlatformModule } from './modules/platform/platform.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { CustomerModule } from './modules/customer/customer.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    PrismaModule,      // global — provides PrismaService + TenantPrismaService
    PlatformModule,    // /api/v1/platform/*   — super-admin
    MerchantModule,    // /api/v1/merchant/*   — shop owner
    StorefrontModule,  // /api/v1/storefront/* — public storefront
    CustomerModule,    // /api/v1/customer/*   — customer auth
    PaymentModule,     // /api/v1/payments/*   — Razorpay
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
