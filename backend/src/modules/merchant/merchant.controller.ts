import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
  Header,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request } from 'express';
import { MerchantService } from './merchant.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

/**
 * MerchantController — all routes under /api/v1/merchant/*
 *
 * Access scope: shop-scoped (requires tenant context via TenantMiddleware).
 * Used by: merchant-dashboard (the shop owner's admin panel).
 * Each shop sees only its own data — multi-tenant isolation is enforced via req.shopId.
 */
@Controller('api/v1/merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  // ─── Subscription ─────────────────────────────────────────────────────────

  @Get('subscription')
  async getSubscription(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getSubscription(shopId);
  }

  // ─── Shop Settings ────────────────────────────────────────────────────────

  @Patch('settings')
  async updateSettings(
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
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateShopSettings(shopId, dto);
  }

  @Post('theme')
  async switchTheme(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { industry: string; theme: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.switchShopTheme(shopId, dto.industry, dto.theme);
  }

  @Patch('settings/advanced')
  async updateAdvancedSettings(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { slug?: string; status?: string; db_connection_url?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdvancedSettings(shopId, dto);
  }

  // ─── Dashboard Stats ──────────────────────────────────────────────────────

  @Get('stats')
  async getStats(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getShopStats(shopId);
  }

  // ─── File Upload ──────────────────────────────────────────────────────────

  @Post('upload')
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
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      original_name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  @Post('products')
  async createProduct(
    @Req() req: Request & { shopId?: string },
    @Body() dto: CreateProductDto,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createProduct(shopId, dto);
  }

  @Get('products/:id')
  async getProductById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getProductById(shopId, id);
  }

  @Patch('products/:id')
  async updateProduct(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateProduct(shopId, id, dto);
  }

  @Delete('products/:id')
  async deleteProduct(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteProduct(shopId, id);
  }

  // ─── Variants ─────────────────────────────────────────────────────────────

  @Get('products/:productId/variants')
  async getProductVariants(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getProductVariants(shopId, productId);
  }

  @Post('products/:productId/variants')
  async createVariant(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createVariant(shopId, productId, dto);
  }

  @Patch('variants/:id')
  async updateVariant(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateVariant(shopId, id, dto);
  }

  @Delete('variants/:id')
  async deleteVariant(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteVariant(shopId, id);
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  @Post('categories')
  async createCategory(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createCategory(shopId, dto);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateCategory(shopId, id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteCategory(shopId, id);
  }

  // ─── Collections ──────────────────────────────────────────────────────────

  @Get('collections')
  async getCollections(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getCollections(shopId);
  }

  @Post('collections')
  async createCollection(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; slug: string; description?: string; image_url?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createCollection(shopId, dto);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  @Get('orders')
  async getOrders(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getOrders(shopId);
  }

  @Patch('orders/:id/status')
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
    if (!shopId) throw new BadRequestException('Shop context missing');
    const { status, note, ...extra } = body;
    try {
      return await this.merchantService.updateOrderStatus(shopId, id, status, note, extra);
    } catch (err: any) {
      console.error('[updateOrderStatus] ERROR:', err?.message, err?.code, JSON.stringify(err?.meta));
      throw err;
    }
  }

  // ─── Returns ──────────────────────────────────────────────────────────────

  @Get('returns')
  async getReturns(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getReturns(shopId);
  }

  @Get('returns/:id')
  async getReturnById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getReturnById(shopId, id);
  }

  @Post('returns')
  async createReturn(
    @Req() req: Request & { shopId?: string },
    @Body() dto: {
      order_id: string;
      reason: string;
      images?: string[];
      customer_note?: string;
      items: Array<{ variant_id: string; qty: number; price: number }>;
    },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createReturn(shopId, dto);
  }

  @Patch('returns/:id/status')
  async updateReturnStatus(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: {
      status: string;
      staff_note?: string;
      refund_amount?: number;
      refund_method?: string;
    },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateReturnStatus(shopId, id, dto);
  }

  // ─── Banners ──────────────────────────────────────────────────────────────

  @Get('banners')
  async getBanners(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminBanners(shopId);
  }

  @Get('banners/:id')
  async getBannerById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminBannerById(shopId, id);
  }

  @Post('banners')
  async createBanner(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createAdminBanner(shopId, dto);
  }

  @Patch('banners/:id')
  async updateBanner(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdminBanner(shopId, id, dto);
  }

  @Delete('banners/:id')
  async deleteBanner(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteAdminBanner(shopId, id);
  }

  // ─── Homepage Sections ────────────────────────────────────────────────────

  @Post('sections')
  async createSection(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createSection(shopId, dto);
  }

  @Get('home-sections')
  async getHomeSections(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminHomeSections(shopId);
  }

  @Patch('home-sections')
  async updateHomeSection(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdminHomeSection(shopId, dto);
  }

  // ─── CMS Pages ────────────────────────────────────────────────────────────

  @Get('pages')
  async getPages(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminPages(shopId);
  }

  @Get('pages/:id')
  async getPageById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminPageById(shopId, id);
  }

  @Post('pages')
  async createPage(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createAdminPage(shopId, dto);
  }

  @Patch('pages/:id')
  async updatePage(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdminPage(shopId, id, dto);
  }

  @Delete('pages/:id')
  async deletePage(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteAdminPage(shopId, id);
  }

  // Static page text content (About, Privacy, Terms, etc.)
  @Get('page-content')
  async getPageContent(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getPageContent(shopId);
  }

  @Patch('page-content')
  async savePageContent(
    @Req() req: Request & { shopId?: string },
    @Body() dto: Record<string, string>,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.savePageContent(shopId, dto);
  }

  // ─── Blog Posts ───────────────────────────────────────────────────────────

  @Get('blog')
  async getBlogs(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminBlogs(shopId);
  }

  @Get('blog/:id')
  async getBlogById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminBlogById(shopId, id);
  }

  @Post('blog')
  async createBlog(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createAdminBlog(shopId, dto);
  }

  @Patch('blog/:id')
  async updateBlog(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdminBlog(shopId, id, dto);
  }

  @Delete('blog/:id')
  async deleteBlog(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteAdminBlog(shopId, id);
  }

  // ─── Media Library ────────────────────────────────────────────────────────

  @Get('media')
  async getMedia(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminMedia(shopId);
  }

  @Post('media')
  async createMedia(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createAdminMedia(shopId, dto);
  }

  @Delete('media/:id')
  async deleteMedia(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteAdminMedia(shopId, id);
  }

  // ─── FAQs ─────────────────────────────────────────────────────────────────

  @Get('faqs')
  async getFaqs(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminFaqs(shopId);
  }

  @Post('faqs')
  async createFaq(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createAdminFaq(shopId, dto);
  }

  @Patch('faqs/:id')
  async updateFaq(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdminFaq(shopId, id, dto);
  }

  @Delete('faqs/:id')
  async deleteFaq(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteAdminFaq(shopId, id);
  }

  // ─── Testimonials ─────────────────────────────────────────────────────────

  @Get('testimonials')
  async getTestimonials(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getAdminTestimonials(shopId);
  }

  @Post('testimonials')
  async createTestimonial(
    @Req() req: Request & { shopId?: string },
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createAdminTestimonial(shopId, dto);
  }

  @Patch('testimonials/:id')
  async updateTestimonial(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateAdminTestimonial(shopId, id, dto);
  }

  @Delete('testimonials/:id')
  async deleteTestimonial(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteAdminTestimonial(shopId, id);
  }

  // ─── Staff / Users ────────────────────────────────────────────────────────

  @Get('users')
  async getUsers(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getShopUsers(shopId);
  }

  @Post('users')
  async addUser(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; email: string; password?: string; role?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.addShopUser(shopId, dto);
  }

  @Delete('users/:id')
  async deleteUser(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteShopUser(shopId, id);
  }

  // ─── Custom Domains ───────────────────────────────────────────────────────

  @Get('domains')
  async getDomains(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getShopDomains(shopId);
  }

  @Post('domains')
  async addDomain(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { domain: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.addShopDomain(shopId, dto);
  }

  @Post('domains/:id/verify')
  async verifyDomain(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.verifyDomain(shopId, id);
  }

  @Patch('domains/:id/primary')
  async setPrimaryDomain(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.setPrimaryDomain(shopId, id);
  }

  @Delete('domains/:id')
  async deleteDomain(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteShopDomain(shopId, id);
  }

  // ─── Config Overrides ─────────────────────────────────────────────────────

  @Get('configs')
  async getConfigs(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getConfigOverrides(shopId);
  }

  @Post('configs/override')
  async saveConfig(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { key: string; value: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.saveConfigOverride(shopId, dto);
  }

  @Delete('configs/override/:key')
  async deleteConfig(
    @Req() req: Request & { shopId?: string },
    @Param('key') key: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.deleteConfigOverride(shopId, key);
  }

  // ─── Backups ──────────────────────────────────────────────────────────────

  @Get('backup/json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="shop_backup.json"')
  async getJsonBackup(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getJsonBackup(shopId);
  }

  @Get('backup/sql')
  @Header('Content-Type', 'application/sql')
  @Header('Content-Disposition', 'attachment; filename="db_export.sql"')
  async getSqlBackup(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getSqlBackup();
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  // Note: ReviewsController (in merchant module) also serves /api/v1/merchant/products/:id/reviews
  // These endpoints here delegate to the same underlying service if needed in future.

  // ─── Inventory ────────────────────────────────────────────────────────────
  // Note: InventoryController (in merchant module) serves /api/v1/merchant/inventory routes.

  // ─── Invoices ─────────────────────────────────────────────────────────────

  @Get('invoices')
  async getInvoices(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getInvoices(shopId);
  }

  @Get('invoices/:id')
  async getInvoiceById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.getInvoiceById(shopId, id);
  }

  @Post('orders/:orderId/invoice')
  async createInvoice(
    @Req() req: Request & { shopId?: string },
    @Param('orderId') orderId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.createInvoiceFromOrder(shopId, orderId);
  }

  @Patch('invoices/:id/status')
  async updateInvoiceStatus(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.updateInvoiceStatus(shopId, id, dto.status);
  }

  @Post('invoices/:id/print')
  async logInvoicePrint(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.logInvoicePrint(shopId, id);
  }

  @Post('invoices/:id/email')
  async emailInvoice(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.merchantService.emailInvoice(shopId, id);
  }
}
