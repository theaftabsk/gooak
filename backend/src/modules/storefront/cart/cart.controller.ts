import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { CartService } from './cart.service';

@Controller('api/v1/storefront')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // session_id: UUID stored in browser localStorage.
  // customer_id: present when the customer is logged in.
  // If both are provided, customer_id takes precedence.

  @Get('cart')
  getCart(
    @Req() req: Request & { shopId?: string },
    @Query('session_id') sessionId?: string,
    @Query('customer_id') customerId?: string,
  ) {
    return this.cartService.getCart(req.shopId!, sessionId, customerId);
  }

  @Post('cart/items')
  addToCart(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { session_id?: string; customer_id?: string; variant_id: string; qty: number },
  ) {
    return this.cartService.addToCart(req.shopId!, dto);
  }

  @Patch('cart/items/:itemId')
  updateCartItem(
    @Req() req: Request & { shopId?: string },
    @Param('itemId') itemId: string,
    @Body() body: { qty: number; session_id?: string; customer_id?: string },
  ) {
    return this.cartService.updateCartItem(req.shopId!, itemId, body.qty, body.session_id, body.customer_id);
  }

  @Delete('cart/items/:itemId')
  removeCartItem(
    @Req() req: Request & { shopId?: string },
    @Param('itemId') itemId: string,
    @Query('session_id') sessionId?: string,
    @Query('customer_id') customerId?: string,
  ) {
    return this.cartService.removeCartItem(req.shopId!, itemId, sessionId, customerId);
  }

  @Post('cart/coupon')
  applyCoupon(
    @Req() req: Request & { shopId?: string },
    @Body() body: { code: string; session_id?: string; customer_id?: string; guest_email?: string },
  ) {
    return this.cartService.applyCoupon(req.shopId!, body.code, body.session_id, body.customer_id, body.guest_email);
  }

  @Delete('cart/coupon')
  removeCoupon(
    @Req() req: Request & { shopId?: string },
    @Query('session_id') sessionId?: string,
    @Query('customer_id') customerId?: string,
  ) {
    return this.cartService.removeCoupon(req.shopId!, sessionId, customerId);
  }
}
