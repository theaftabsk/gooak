import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { PageBuilderModule } from './modules/page-builder/page-builder.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [PrismaModule, PageBuilderModule, PaymentModule, CatalogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
