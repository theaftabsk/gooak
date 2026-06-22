import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { StorefrontService } from './storefront.service';

/**
 * StorefrontController — all routes under /api/v1/storefront/*
 *
 * Access scope: public, tenant-scoped (shop resolved via TenantMiddleware).
 * Used by: storefront-live (the end-customer facing store).
 * No authentication required unless noted. Each shop's data is isolated by shopId.
 */
@Controller('api/v1/storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  // ─── Homepage ─────────────────────────────────────────────────────────────

  @Get('homepage')
  async getHomepage(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getHomepageData(shopId);
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  @Get('products')
  async getProducts(
    @Req() req: Request & { shopId?: string },
    @Query() query: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getProducts(shopId, query);
  }

  @Get('products/:slug')
  async getProduct(
    @Req() req: Request & { shopId?: string },
    @Param('slug') slug: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getProductBySlug(shopId, slug);
  }

  // ─── Categories & Brands ──────────────────────────────────────────────────

  @Get('categories')
  async getCategories(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getCategories(shopId);
  }

  @Get('brands')
  async getBrands(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getBrands(shopId);
  }

  // ─── Shop Settings (public) ───────────────────────────────────────────────

  @Get('settings')
  async getSystemSettings() {
    return this.storefrontService.getPublicSystemSettings();
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  @Post('orders')
  async placeOrder(
    @Req() req: Request & { shopId?: string },
    @Body()
    dto: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      shipping_address: any;
      payment_method: string;
      notes?: string;
      items: { variant_id: string; qty: number }[];
    },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.placeOrder(shopId, dto);
  }

  @Get('orders/:id')
  async getPublicOrder(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getPublicOrderById(shopId, id);
  }

  // ─── Static Page Content (About, Privacy, Terms, etc.) ───────────────────

  @Get('page-content')
  async getPageContent(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.getPageContent(shopId);
  }

  // ─── Contact Form ─────────────────────────────────────────────────────────

  @Post('contact')
  async submitContact(
    @Req() req: Request & { shopId?: string },
    @Body()
    dto: { name: string; email: string; subject?: string; message: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.storefrontService.submitContactForm(shopId, dto);
  }

  // ─── Platform Tenant Signup Request (public) ──────────────────────────────

  @Post('requests')
  async createTenantRequest(
    @Body()
    dto: {
      name: string;
      slug: string;
      ownerName: string;
      ownerEmail: string;
      phone?: string;
      category?: string;
    },
  ) {
    return this.storefrontService.createTenantRequest(dto);
  }
}
