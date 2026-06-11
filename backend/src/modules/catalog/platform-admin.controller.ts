import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import * as express from 'express';
import { CatalogService } from './catalog.service';

@Controller('api/v1/catalog')
export class PlatformAdminController {
  constructor(private readonly catalogService: CatalogService) {}

  // Helper method to verify the Super Admin token from the Authorization header
  private async verifyAdmin(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token missing.');
    }
    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'oaksol-commerce-jwt-secret-key-replace-in-production';
    try {
      const payload = jwt.verify(token, secret) as any;
      if (payload.role !== 'super_admin') {
        throw new UnauthorizedException('Access denied. Super Admin only.');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  // ── SUPER ADMIN LOGIN ──────────────────────────────────────────────────────
  @Post('admin/login')
  async adminLogin(@Body() dto: { email: string; password: string }) {
    return this.catalogService.adminLogin(dto);
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  @Get('admin/stats')
  async getDashboardStats(@Req() req: express.Request) {
    await this.verifyAdmin(req);
    return this.catalogService.getDashboardStats();
  }

  // ── SHOPS ─────────────────────────────────────────────────────────────────
  @Post('register-shop')
  async registerShop(
    @Req() req: express.Request,
    @Body() dto: { name: string; slug: string; ownerEmail: string; ownerName: string; ownerPassword?: string }
  ) {
    await this.verifyAdmin(req);
    return this.catalogService.registerShop(dto);
  }

  @Get('admin/shops')
  async getShops(@Req() req: express.Request) {
    await this.verifyAdmin(req);
    return this.catalogService.getShops();
  }

  @Get('admin/shops/:id')
  async getShopDetail(@Req() req: express.Request, @Param('id') id: string) {
    await this.verifyAdmin(req);
    return this.catalogService.getShopDetail(id);
  }

  @Patch('admin/shops/:id')
  async updateShop(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() dto: { name?: string; plan?: string; status?: string; description?: string }
  ) {
    await this.verifyAdmin(req);
    return this.catalogService.updateShop(id, dto);
  }

  @Delete('admin/shops/:id')
  async deleteShop(@Req() req: express.Request, @Param('id') id: string) {
    await this.verifyAdmin(req);
    return this.catalogService.deleteShop(id);
  }

  @Post('admin/shops/:id/seed-demo')
  async seedDemoData(@Req() req: express.Request, @Param('id') id: string) {
    await this.verifyAdmin(req);
    return this.catalogService.seedDemoData(id);
  }

  // ── TENANT REQUESTS ───────────────────────────────────────────────────────
  @Get('admin/tenant-requests')
  async getTenantRequests(@Req() req: express.Request) {
    await this.verifyAdmin(req);
    return this.catalogService.getTenantRequests();
  }

  @Post('admin/tenant-requests/:id/approve')
  async approveTenantRequest(@Req() req: express.Request, @Param('id') id: string) {
    await this.verifyAdmin(req);
    return this.catalogService.approveTenantRequest(id);
  }

  @Post('admin/tenant-requests/:id/reject')
  async rejectTenantRequest(@Req() req: express.Request, @Param('id') id: string) {
    await this.verifyAdmin(req);
    return this.catalogService.rejectTenantRequest(id);
  }

  @Delete('admin/tenant-requests/:id')
  async deleteTenantRequest(@Req() req: express.Request, @Param('id') id: string) {
    await this.verifyAdmin(req);
    return this.catalogService.deleteTenantRequest(id);
  }
}
