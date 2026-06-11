import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';

@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // 1. Get Homepage data (banners & dynamic product sections)
  @Get('homepage')
  async getHomepage(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getHomepageData(shopId);
  }

  // 2. List products with filters and search
  @Get('products')
  async getProducts(
    @Req() req: Request & { shopId?: string },
    @Query() query: any
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getProducts(shopId, query);
  }

  // 3. Get individual product detailed page by slug
  @Get('products/:slug')
  async getProduct(
    @Req() req: Request & { shopId?: string },
    @Param('slug') slug: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getProductBySlug(shopId, slug);
  }

  // 4. Get nested category tree
  @Get('categories')
  async getCategories(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getCategories(shopId);
  }

  // 5. Get active brands
  @Get('brands')
  async getBrands(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getBrands(shopId);
  }

  // 6. Create storefront order placement
  @Post('orders')
  async placeOrder(
    @Req() req: Request & { shopId?: string },
    @Body() dto: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      shipping_address: any;
      payment_method: string;
      notes?: string;
      items: { variant_id: string; qty: number }[];
    }
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.placeOrder(shopId, dto);
  }

  // 7. Get public order detail (for payment page)
  @Get('orders/:id')
  async getPublicOrder(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getPublicOrderById(shopId, id);
  }

  // ================= ADMIN ENDPOINTS =================

  @Post('admin/products')
  async createProduct(
    @Req() req: Request & { shopId?: string },
    @Body() dto: CreateProductDto
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.createProduct(shopId, dto);
  }

  @Post('admin/banners')
  async createBanner(
    @Req() req: Request & { shopId?: string },
    @Body() dto: CreateBannerDto
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.createBanner(shopId, dto);
  }

  @Post('admin/sections')
  async createSection(
    @Req() req: Request & { shopId?: string },
    @Body() dto: CreateSectionDto
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.createSection(shopId, dto);
  }
  @Get('admin/products/:id')
  async getProductById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getProductById(shopId, id);
  }

  @Patch('admin/products/:id')
  async updateProduct(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.updateProduct(shopId, id, dto);
  }

  @Delete('admin/products/:id')
  async deleteProduct(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.deleteProduct(shopId, id);
  }

  @Post('admin/categories')
  async createCategory(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.createCategory(shopId, dto);
  }

  @Patch('admin/categories/:id')
  async updateCategory(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.updateCategory(shopId, id, dto);
  }

  @Delete('admin/categories/:id')
  async deleteCategory(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.deleteCategory(shopId, id);
  }

  @Delete('admin/banners/:id')
  async deleteBanner(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.deleteBanner(shopId, id);
  }

  @Get('admin/orders')
  async getOrders(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.getOrders(shopId);
  }

  @Patch('admin/orders/:id/status')
  async updateOrderStatus(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() body: { status: string; note?: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.updateOrderStatus(shopId, id, body.status, body.note);
  }

  // ── Review Management (Admin) ─────────────────────────────────────────────

  @Get('admin/products/:productId/reviews')
  async getProductReviews(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getProductReviews(shopId, productId);
  }

  @Post('admin/products/:productId/reviews')
  async createReview(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
    @Body() dto: { reviewer_name?: string; rating: number; title?: string; body?: string; status?: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createReview(shopId, productId, dto);
  }

  @Patch('admin/reviews/:id/status')
  async updateReviewStatus(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateReviewStatus(shopId, id, body.status);
  }

  @Delete('admin/reviews/:id')
  async deleteReview(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteReview(shopId, id);
  }

  // ── Variant Management (Admin) ────────────────────────────────────────────

  @Get('admin/products/:productId/variants')
  async getProductVariants(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getProductVariants(shopId, productId);
  }

  @Post('admin/products/:productId/variants')
  async createVariant(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createVariant(shopId, productId, dto);
  }

  @Patch('admin/variants/:id')
  async updateVariant(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateVariant(shopId, id, dto);
  }

  @Delete('admin/variants/:id')
  async deleteVariant(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteVariant(shopId, id);
  }

  @Post('admin/variants/:id/stock')
  async adjustStock(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() body: { adjustment: number; type?: string; note?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.adjustStock(shopId, id, body);
  }

  @Get('admin/products/:productId/stock-logs')
  async getStockLogs(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getStockLogs(shopId, productId);
  }

  @Get('admin/inventory')
  async getInventoryOverview(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getInventoryOverview(shopId);
  }

  // 6. Public Platform tenant signup request submission
  @Post('tenant-requests')
  async createTenantRequest(
    @Body() dto: { name: string; slug: string; ownerName: string; ownerEmail: string; phone?: string; category?: string }
  ) {
    return this.catalogService.createTenantRequest(dto);
  }

  // ─── Customer Auth & Profile ─────────────────────────────────────────────────

  @Post('customer/register')
  async customerRegister(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; email: string; phone?: string; password: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.customerRegister(shopId, dto);
  }

  @Post('customer/login')
  async customerLogin(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { email: string; password: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.customerLogin(shopId, dto);
  }

  @Get('customer/me')
  async getCustomerMe(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    const { customerId } = await this.catalogService.verifyCustomerToken(token);
    return this.catalogService.getCustomerMe(shopId, customerId);
  }

  @Patch('customer/me')
  async updateCustomerMe(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name?: string; phone?: string; avatar_url?: string; current_password?: string; new_password?: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    const { customerId } = await this.catalogService.verifyCustomerToken(token);
    return this.catalogService.updateCustomerMe(shopId, customerId, dto);
  }

  @Get('customer/orders')
  async getCustomerOrders(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    const { customerId } = await this.catalogService.verifyCustomerToken(token);
    return this.catalogService.getCustomerOrders(shopId, customerId);
  }

  // ─── Pages Content ────────────────────────────────────────────────────────────

  @Get('pages')
  async getPages(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getPageContent(shopId);
  }

  @Patch('pages')
  async savePages(
    @Req() req: Request & { shopId?: string },
    @Body() dto: Record<string, string>
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.savePageContent(shopId, dto);
  }

  // ─── Contact Form ─────────────────────────────────────────────────────────────

  @Post('contact')
  async submitContact(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; email: string; subject?: string; message: string }
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.submitContactForm(shopId, dto);
  }
}

