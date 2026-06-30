import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomerService } from './customer.service';

/**
 * CustomerController — /api/v1/customer/*
 *
 * All routes require a valid customer JWT in the Authorization header.
 * shopId is injected by TenantMiddleware.
 */
@Controller('api/v1/customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  private shopId(req: Request & { shopId?: string }): string {
    if (!req.shopId) throw new BadRequestException('Shop context missing from request');
    return req.shopId;
  }

  private async auth(req: Request & { shopId?: string }) {
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    return this.customerService.verifyCustomerToken(token);
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  @Post('register')
  register(@Req() req: Request & { shopId?: string }, @Body() dto: { name: string; email: string; phone?: string; password: string }) {
    return this.customerService.customerRegister(this.shopId(req), dto);
  }

  @Post('login')
  login(@Req() req: Request & { shopId?: string }, @Body() dto: { email: string; password: string }) {
    return this.customerService.customerLogin(this.shopId(req), dto);
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  @Get('me')
  async getMe(@Req() req: Request & { shopId?: string }) {
    const { customerId } = await this.auth(req);
    return this.customerService.getCustomerMe(this.shopId(req), customerId);
  }

  @Patch('me')
  async updateMe(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name?: string; phone?: string; avatar_url?: string; current_password?: string; new_password?: string },
  ) {
    const { customerId } = await this.auth(req);
    return this.customerService.updateCustomerMe(this.shopId(req), customerId, dto);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  @Get('orders')
  async getOrders(
    @Req() req: Request & { shopId?: string },
    @Query() query: { page?: number; limit?: number; status?: string },
  ) {
    const { customerId } = await this.auth(req);
    return this.customerService.getCustomerOrders(this.shopId(req), customerId, query);
  }

  @Get('orders/:orderId')
  async getOrderDetail(@Req() req: Request & { shopId?: string }, @Param('orderId') orderId: string) {
    const { customerId } = await this.auth(req);
    return this.customerService.getOrderDetail(this.shopId(req), customerId, orderId);
  }

  // Cancel order — only allowed while pending or confirmed (not yet shipped)
  @Post('orders/:orderId/cancel')
  async cancelOrder(
    @Req() req: Request & { shopId?: string },
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    const { customerId } = await this.auth(req);
    return this.customerService.cancelOrder(this.shopId(req), customerId, orderId, body.reason);
  }

  // ─── Refunds ──────────────────────────────────────────────────────────────

  // Request a refund on a delivered order
  @Post('orders/:orderId/refund')
  async requestRefund(
    @Req() req: Request & { shopId?: string },
    @Param('orderId') orderId: string,
    @Body() dto: { reason: string; items: { order_item_id: string; qty: number }[]; method?: string },
  ) {
    const { customerId } = await this.auth(req);
    return this.customerService.requestRefund(this.shopId(req), customerId, orderId, dto);
  }

  // List all refund requests across all orders for this customer
  @Get('refunds')
  async getRefunds(@Req() req: Request & { shopId?: string }) {
    const { customerId } = await this.auth(req);
    return this.customerService.getMyRefunds(this.shopId(req), customerId);
  }

  // ─── Wishlist ─────────────────────────────────────────────────────────────

  @Get('wishlist')
  async getWishlist(@Req() req: Request & { shopId?: string }) {
    const { customerId } = await this.auth(req);
    return this.customerService.getWishlist(this.shopId(req), customerId);
  }

  @Post('wishlist')
  async addToWishlist(
    @Req() req: Request & { shopId?: string },
    @Body() body: { variant_id: string },
  ) {
    if (!body.variant_id) throw new BadRequestException('variant_id required');
    const { customerId } = await this.auth(req);
    return this.customerService.addToWishlist(this.shopId(req), customerId, body.variant_id);
  }

  @Delete('wishlist/:variantId')
  async removeFromWishlist(
    @Req() req: Request & { shopId?: string },
    @Param('variantId') variantId: string,
  ) {
    const { customerId } = await this.auth(req);
    return this.customerService.removeFromWishlist(this.shopId(req), customerId, variantId);
  }

  // ─── Cart Merge ───────────────────────────────────────────────────────────
  // Call this immediately after login to absorb the guest cart into the customer cart.

  @Post('cart/merge')
  async mergeCart(
    @Req() req: Request & { shopId?: string },
    @Body() body: { session_id: string },
  ) {
    if (!body.session_id) throw new BadRequestException('session_id required');
    const { customerId } = await this.auth(req);
    return this.customerService.mergeCart(this.shopId(req), body.session_id, customerId);
  }
}
