import { Controller, Get, Post, Body, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './order.service';

@Controller('api/v1/storefront')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('orders')
  placeOrder(
    @Req() req: Request & { shopId?: string },
    @Body() dto: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      session_id?: string;
      customer_id?: string;
      items?: { variant_id: string; qty: number }[];
      shipping_address: any;
      payment_method: string;
      coupon_code?: string;
      notes?: string;
    },
  ) {
    return this.orderService.placeOrder(req.shopId!, dto);
  }

  // Guest order lookup — verified by order_number + email, no account required.
  // Must be registered before `:id` to avoid route shadowing.
  @Get('orders/lookup')
  lookupGuestOrder(
    @Req() req: Request & { shopId?: string },
    @Query('order_number') orderNumber: string,
    @Query('email') email: string,
  ) {
    if (!orderNumber || !email) throw new BadRequestException('order_number and email are required');
    return this.orderService.lookupGuestOrder(req.shopId!, orderNumber, email);
  }

  @Get('orders/:id')
  getPublicOrder(@Req() req: Request & { shopId?: string }, @Param('id') id: string) {
    return this.orderService.getPublicOrderById(req.shopId!, id);
  }
}
