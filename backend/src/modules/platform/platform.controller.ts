import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { PlatformService } from './platform.service';
import { hasPermission } from '../../common/utils/permissions';

interface AdminRequest extends express.Request {
  admin?: {
    permissions: string[];
  };
}

/**
 * PlatformController — all routes under /api/v1/platform/*
 *
 * Access scope: platform-wide, no tenant context required.
 * Used by: super-admin dashboard only.
 * The highest permission level — can manage all shops, admins, and platform-wide settings.
 * Each endpoint verifies a super_admin JWT and checks granular permissions.
 */
@Controller('api/v1/platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  // ─── Auth ─────────────────────────────────────────────────────────────────

  @Post('auth/login')
  async adminLogin(
    @Body() dto: { email: string; password: string },
  ) {
    return this.platformService.platformAdminLogin(dto);
  }

  // Verifies super_admin JWT and attaches permissions to the request
  private async verifyAdmin(req: AdminRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token missing.');
    }
    const token = authHeader.split(' ')[1];
    const secret =
      process.env.JWT_SECRET ||
      'oaksol-commerce-jwt-secret-key-replace-in-production';
    try {
      const payload = jwt.verify(token, secret) as any;
      if (payload.role !== 'super_admin') {
        throw new UnauthorizedException('Access denied. Super Admin only.');
      }
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@oaksol.in';
      req.admin = {
        permissions:
          payload.email === defaultEmail
            ? [
                'VIEW_SHOPS',
                'VIEW_STATS',
                'VIEW_REQUESTS',
                'ONBOARD_SHOP',
                'MANAGE_REQUESTS',
                'SEED_DEMO',
                'DELETE_SHOP',
                'MANAGE_TEAM',
              ]
            : payload.permissions || [],
      };
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  // ─── Platform Stats ───────────────────────────────────────────────────────

  @Get('stats')
  async getDashboardStats(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_STATS')) {
      throw new UnauthorizedException('Access denied. VIEW_STATS permission required.');
    }
    return this.platformService.getDashboardStats();
  }

  // ─── Shops ────────────────────────────────────────────────────────────────

  @Post('shops')
  async registerShop(
    @Req() req: AdminRequest,
    @Body()
    dto: {
      name: string;
      slug: string;
      ownerEmail: string;
      ownerName: string;
      ownerPassword?: string;
      industry?: string;
      theme?: string;
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) {
      throw new UnauthorizedException('Access denied. ONBOARD_SHOP permission required.');
    }
    return this.platformService.registerShop(dto);
  }

  @Get('shops')
  async getShops(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) {
      throw new UnauthorizedException('Access denied. VIEW_SHOPS permission required.');
    }
    return this.platformService.getShops();
  }

  @Get('shops/:id')
  async getShopDetail(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) {
      throw new UnauthorizedException('Access denied. VIEW_SHOPS permission required.');
    }
    return this.platformService.getShopDetail(id);
  }

  @Patch('shops/:id')
  async updateShop(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: { name?: string; plan?: string; status?: string; description?: string },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) {
      throw new UnauthorizedException('Access denied. ONBOARD_SHOP permission required.');
    }
    return this.platformService.updateShop(id, dto);
  }

  @Delete('shops/:id')
  async deleteShop(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'DELETE_SHOP')) {
      throw new UnauthorizedException('Access denied. DELETE_SHOP permission required.');
    }
    return this.platformService.deleteShop(id);
  }

  // ─── Tenant Signup Requests ───────────────────────────────────────────────

  @Get('requests')
  async getTenantRequests(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_REQUESTS')) {
      throw new UnauthorizedException('Access denied. VIEW_REQUESTS permission required.');
    }
    return this.platformService.getTenantRequests();
  }

  @Post('requests/:id/approve')
  async approveTenantRequest(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_REQUESTS')) {
      throw new UnauthorizedException('Access denied. MANAGE_REQUESTS permission required.');
    }
    return this.platformService.approveTenantRequest(id);
  }

  @Post('requests/:id/reject')
  async rejectTenantRequest(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_REQUESTS')) {
      throw new UnauthorizedException('Access denied. MANAGE_REQUESTS permission required.');
    }
    return this.platformService.rejectTenantRequest(id);
  }

  @Delete('requests/:id')
  async deleteTenantRequest(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_REQUESTS')) {
      throw new UnauthorizedException('Access denied. MANAGE_REQUESTS permission required.');
    }
    return this.platformService.deleteTenantRequest(id);
  }

  // ─── Platform Team (admin accounts) ──────────────────────────────────────

  @Get('team')
  async getPlatformTeam(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException('Access denied. MANAGE_TEAM permission required.');
    }
    return this.platformService.getPlatformTeam();
  }

  @Get('team/:id')
  async getPlatformAdmin(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException('Access denied. MANAGE_TEAM permission required.');
    }
    return this.platformService.getPlatformAdmin(id);
  }

  @Post('team')
  async createPlatformAdmin(
    @Req() req: AdminRequest,
    @Body()
    dto: {
      name: string;
      email: string;
      password?: string;
      permissions?: string[];
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException('Access denied. MANAGE_TEAM permission required.');
    }
    return this.platformService.createPlatformAdmin(dto);
  }

  @Patch('team/:id')
  async updatePlatformAdmin(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: { status?: string; permissions?: string[] },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException('Access denied. MANAGE_TEAM permission required.');
    }
    return this.platformService.updatePlatformAdmin(id, dto);
  }

  @Delete('team/:id')
  async deletePlatformAdmin(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException('Access denied. MANAGE_TEAM permission required.');
    }
    return this.platformService.deletePlatformAdmin(id);
  }

  // ─── Subscription Plans ───────────────────────────────────────────────────

  @Get('plans')
  async getPlans(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    return this.platformService.getPlans();
  }

  @Post('plans')
  async createPlan(
    @Req() req: AdminRequest,
    @Body() dto: {
      name: string; slug: string; level: number; is_free?: boolean;
      price: number; interval?: string; max_products?: number;
      max_orders?: number; features?: string[]; sort_order?: number;
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.createPlan(dto);
  }

  @Patch('plans/:id')
  async updatePlan(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: any) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  async deletePlan(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.deletePlan(id);
  }

  // ─── Add-ons ──────────────────────────────────────────────────────────────

  @Get('addons')
  async getAddons(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    return this.platformService.getAddons();
  }

  @Post('addons')
  async createAddon(
    @Req() req: AdminRequest,
    @Body() dto: { name: string; slug: string; description?: string; price: number; interval?: string },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.createAddon(dto);
  }

  @Patch('addons/:id')
  async updateAddon(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: any) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.updateAddon(id, dto);
  }

  @Delete('addons/:id')
  async deleteAddon(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.deleteAddon(id);
  }

  // ─── Promo Codes ──────────────────────────────────────────────────────────

  @Get('promos')
  async getPromoCodes(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    return this.platformService.getPromoCodes();
  }

  @Post('promos')
  async createPromoCode(
    @Req() req: AdminRequest,
    @Body() dto: {
      code: string; description?: string; discount_type: string; discount_value: number;
      applicable_plans?: string[]; max_uses?: number; starts_at?: string; expires_at?: string;
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.createPromoCode(dto);
  }

  @Post('promos/validate')
  async validatePromoCode(@Req() req: AdminRequest, @Body() dto: { code: string; plan_slug: string }) {
    await this.verifyAdmin(req);
    return this.platformService.validatePromoCode(dto.code, dto.plan_slug);
  }

  @Patch('promos/:id')
  async updatePromoCode(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: any) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.updatePromoCode(id, dto);
  }

  @Delete('promos/:id')
  async deletePromoCode(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.deletePromoCode(id);
  }

  // ─── All Subscriptions ────────────────────────────────────────────────────

  @Get('subscriptions')
  async getAllSubscriptions(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) throw new UnauthorizedException('Access denied.');
    return this.platformService.getAllSubscriptions();
  }

  // ─── Shop Subscription Management ────────────────────────────────────────

  @Get('shops/:id/subscription')
  async getShopSubscription(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) throw new UnauthorizedException('Access denied.');
    return this.platformService.getShopSubscription(id);
  }

  @Post('shops/:id/subscription')
  async assignSubscription(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: {
      plan_id: string; status?: string; is_trial?: boolean; trial_ends_at?: string;
      current_period_start?: string; current_period_end?: string;
      next_payment_at?: string; promo_code?: string; payment_status?: string;
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.assignSubscription(id, dto);
  }

  @Delete('shops/:id/subscription')
  async cancelSubscription(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: { reason?: string },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.cancelSubscription(id, dto);
  }

  @Post('shops/:id/subscription/addons/:addonId')
  async addAddonToSubscription(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Param('addonId') addonId: string,
    @Body() dto: { quantity?: number },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.addAddonToSubscription(id, addonId, dto.quantity);
  }

  @Delete('shops/:id/subscription/addons/:addonId')
  async removeAddonFromSubscription(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Param('addonId') addonId: string,
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.removeAddonFromSubscription(id, addonId);
  }

  @Get('shops/:id/subscription/payments')
  async getSubscriptionPayments(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) throw new UnauthorizedException('Access denied.');
    return this.platformService.getSubscriptionPayments(id);
  }

  @Post('shops/:id/subscription/payments')
  async recordSubscriptionPayment(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: {
      amount: number; currency?: string; status: string; gateway?: string;
      transaction_id?: string; invoice_url?: string; promo_code?: string;
      discount?: number; paid_at?: string; failed_at?: string; failure_reason?: string;
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) throw new UnauthorizedException('Access denied.');
    return this.platformService.recordSubscriptionPayment(id, dto);
  }
}
