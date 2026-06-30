import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';

import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';

import { CheckoutController } from './checkout/checkout.controller';
import { CheckoutService } from './checkout/checkout.service';

import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';

import { PagesController } from './pages/pages.controller';
import { PagesService } from './pages/pages.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CatalogController,
    CartController,
    CheckoutController,
    OrderController,
    PagesController,
  ],
  providers: [
    CatalogService,
    CartService,
    CheckoutService,
    OrderService,
    PagesService,
  ],
  exports: [CartService, CheckoutService, OrderService],
})
export class StorefrontModule {}
