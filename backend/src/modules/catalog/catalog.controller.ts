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
  Header,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request } from 'express';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

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
    @Query() query: any,
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
    @Param('slug') slug: string,
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

  @Get('system-settings')
  async getSystemSettings() {
    return this.catalogService.getPublicSystemSettings();
  }

  // ================= ADMIN ENDPOINTS =================

  @Post('admin/products')
  async createProduct(
    @Req() req: Request & { shopId?: string },
    @Body() dto: CreateProductDto,
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.createProduct(shopId, dto);
  }

  @Post('admin/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `file-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @Req() req: Request & { shopId?: string },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      original_name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('admin/banners')
  async createBanner(
    @Req() req: Request & { shopId?: string },
    @Body() dto: CreateBannerDto,
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
    @Body() dto: CreateSectionDto,
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
    @Param('id') id: string,
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
    @Body() dto: any,
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
    @Param('id') id: string,
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
    @Body() dto: any,
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
    @Body() dto: any,
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
    @Param('id') id: string,
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
    @Param('id') id: string,
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
    @Body() body: {
      status: string;
      note?: string;
      courier_name?: string;
      tracking_number?: string;
      tracking_url?: string;
      dispatched_at?: string;
      expected_delivery_at?: string;
      fulfillment_status?: string;
      staff_notes?: string;
      return_status?: string;
      paid_amount?: number;
      payment_method?: string;
    },
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    const { status, note, ...extra } = body;
    try {
      return await this.catalogService.updateOrderStatus(
        shopId,
        id,
        status,
        note,
        extra,
      );
    } catch (err: any) {
      console.error('[updateOrderStatus] ERROR:', err?.message, err?.code, JSON.stringify(err?.meta));
      throw err;
    }
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

  // 6. Public Platform tenant signup request submission
  @Post('tenant-requests')
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
    return this.catalogService.createTenantRequest(dto);
  }

  // ─── Pages Content ────────────────────────────────────────────────────────────

  @Get('pages')
  async getPages(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getPageContent(shopId);
  }

  @Patch('pages')
  async savePages(
    @Req() req: Request & { shopId?: string },
    @Body() dto: Record<string, string>,
  ) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    return this.catalogService.savePageContent(shopId, dto);
  }

  // ─── Contact Form ─────────────────────────────────────────────────────────────

  @Post('contact')
  async submitContact(
    @Req() req: Request & { shopId?: string },
    @Body()
    dto: { name: string; email: string; subject?: string; message: string },
  ) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    return this.catalogService.submitContactForm(shopId, dto);
  }

  // Merchant Settings Update Endpoint
  @Patch('merchant/settings')
  async updateMerchantSettings(
    @Req() req: Request & { shopId?: string },
    @Body() dto: {
      name?: string;
      description?: string;
      logo_url?: string;
      currency?: string;
      timezone?: string;
    },
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.updateShopSettings(shopId, dto);
  }

  // Merchant Theme Switch Endpoint
  @Post('merchant/switch-theme')
  async switchTheme(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { industry: string; theme: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.catalogService.switchShopTheme(shopId, dto.industry, dto.theme);
  }

  // Get Store statistics counts
  @Get('admin/stats')
  async getShopStats(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getShopStats(shopId);
  }

  // Staff/Users Endpoints
  @Get('admin/users')
  async getShopUsers(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getShopUsers(shopId);
  }

  @Post('admin/users')
  async addShopUser(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; email: string; password?: string; role?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.addShopUser(shopId, dto);
  }

  @Delete('admin/users/:id')
  async deleteShopUser(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.deleteShopUser(shopId, id);
  }

  // Custom Domains Endpoints
  @Get('admin/domains')
  async getShopDomains(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getShopDomains(shopId);
  }

  @Post('admin/domains')
  async addShopDomain(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { domain: string; type?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.addShopDomain(shopId, dto);
  }

  @Patch('admin/domains/:id/primary')
  async setPrimaryDomain(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.setPrimaryDomain(shopId, id);
  }

  @Delete('admin/domains/:id')
  async deleteShopDomain(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.deleteShopDomain(shopId, id);
  }

  // Config Overrides Endpoints
  @Get('admin/configs')
  async getConfigOverrides(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getConfigOverrides(shopId);
  }

  @Post('admin/configs/override')
  async saveConfigOverride(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { key: string; value: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.saveConfigOverride(shopId, dto);
  }

  @Delete('admin/configs/override/:key')
  async deleteConfigOverride(
    @Req() req: Request & { shopId?: string },
    @Param('key') key: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.deleteConfigOverride(shopId, key);
  }

  // Backups / Exports Endpoints
  @Get('admin/backup/json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="shop_backup.json"')
  async getJsonBackup(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getJsonBackup(shopId);
  }

  @Get('admin/backup/sql')
  @Header('Content-Type', 'application/sql')
  @Header('Content-Disposition', 'attachment; filename="db_export.sql"')
  async getSqlBackup(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getSqlBackup();
  }

  // Advanced Shop Settings Endpoints
  @Patch('admin/settings/advanced')
  async updateAdvancedSettings(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { slug?: string; status?: string; db_connection_url?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.updateAdvancedSettings(shopId, dto);
  }

  // Collections Endpoints
  @Get('admin/collections')
  async getCollections(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.getCollections(shopId);
  }

  @Post('admin/collections')
  async createCollection(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; slug: string; description?: string; image_url?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing from request');
    return this.catalogService.createCollection(shopId, dto);
  }

  // ─── PAGES ADMIN CRUD ──────────────────────────────────────────────────────
  @Get('admin/pages')
  async getAdminPages(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminPages(shopId);
  }

  @Get('admin/pages/:id')
  async getAdminPageById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminPageById(shopId, id);
  }

  @Post('admin/pages')
  async createAdminPage(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createAdminPage(shopId, dto);
  }

  @Patch('admin/pages/:id')
  async updateAdminPage(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateAdminPage(shopId, id, dto);
  }

  @Delete('admin/pages/:id')
  async deleteAdminPage(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteAdminPage(shopId, id);
  }

  // ─── BANNERS ADMIN CRUD ────────────────────────────────────────────────────
  @Get('admin/banners')
  async getAdminBanners(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminBanners(shopId);
  }

  @Get('admin/banners/:id')
  async getAdminBannerById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminBannerById(shopId, id);
  }

  @Post('admin/banners')
  async createAdminBanner(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createAdminBanner(shopId, dto);
  }

  @Patch('admin/banners/:id')
  async updateAdminBanner(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateAdminBanner(shopId, id, dto);
  }

  @Delete('admin/banners/:id')
  async deleteAdminBanner(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteAdminBanner(shopId, id);
  }

  // ─── BLOG POSTS ADMIN CRUD ──────────────────────────────────────────────────
  @Get('admin/blog')
  async getAdminBlogs(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminBlogs(shopId);
  }

  @Get('admin/blog/:id')
  async getAdminBlogById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminBlogById(shopId, id);
  }

  @Post('admin/blog')
  async createAdminBlog(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createAdminBlog(shopId, dto);
  }

  @Patch('admin/blog/:id')
  async updateAdminBlog(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateAdminBlog(shopId, id, dto);
  }

  @Delete('admin/blog/:id')
  async deleteAdminBlog(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteAdminBlog(shopId, id);
  }

  // ─── MEDIA ADMIN CRUD ──────────────────────────────────────────────────────
  @Get('admin/media')
  async getAdminMedia(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminMedia(shopId);
  }

  @Post('admin/media')
  async createAdminMedia(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createAdminMedia(shopId, dto);
  }

  @Delete('admin/media/:id')
  async deleteAdminMedia(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteAdminMedia(shopId, id);
  }

  // ─── FAQS ADMIN CRUD ────────────────────────────────────────────────────────
  @Get('admin/faqs')
  async getAdminFaqs(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminFaqs(shopId);
  }

  @Post('admin/faqs')
  async createAdminFaq(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createAdminFaq(shopId, dto);
  }

  @Patch('admin/faqs/:id')
  async updateAdminFaq(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateAdminFaq(shopId, id, dto);
  }

  @Delete('admin/faqs/:id')
  async deleteAdminFaq(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteAdminFaq(shopId, id);
  }

  // ─── TESTIMONIALS ADMIN CRUD ────────────────────────────────────────────────
  @Get('admin/testimonials')
  async getAdminTestimonials(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminTestimonials(shopId);
  }

  @Post('admin/testimonials')
  async createAdminTestimonial(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.createAdminTestimonial(shopId, dto);
  }

  @Patch('admin/testimonials/:id')
  async updateAdminTestimonial(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateAdminTestimonial(shopId, id, dto);
  }

  @Delete('admin/testimonials/:id')
  async deleteAdminTestimonial(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.deleteAdminTestimonial(shopId, id);
  }

  // ─── HOME SECTIONS ADMIN CRUD ──────────────────────────────────────────────
  @Get('admin/home-sections')
  async getAdminHomeSections(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.getAdminHomeSections(shopId);
  }

  @Patch('admin/home-sections')
  async updateAdminHomeSection(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.catalogService.updateAdminHomeSection(shopId, dto);
  }
}

