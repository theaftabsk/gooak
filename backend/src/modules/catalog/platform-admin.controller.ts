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
import { CatalogService } from './catalog.service';
import { hasPermission } from '../../common/utils/permissions';

interface AdminRequest extends express.Request {
  admin?: {
    permissions: string[];
  };
}

@Controller('api/v1/catalog')
export class PlatformAdminController {
  constructor(private readonly catalogService: CatalogService) {}

  // Helper method to verify the Super Admin token from the Authorization header and set the admin context
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

  // ── SUPER ADMIN LOGIN ──────────────────────────────────────────────────────
  @Post('admin/login')
  async adminLogin(@Body() dto: { email: string; password: string }) {
    return this.catalogService.adminLogin(dto);
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  @Get('admin/platform-stats')
  async getDashboardStats(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_STATS')) {
      throw new UnauthorizedException(
        'Access denied. VIEW_STATS permission required.',
      );
    }
    return this.catalogService.getDashboardStats();
  }

  // ── SHOPS ─────────────────────────────────────────────────────────────────
  @Post('register-shop')
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
      throw new UnauthorizedException(
        'Access denied. ONBOARD_SHOP permission required.',
      );
    }
    return this.catalogService.registerShop(dto);
  }

  @Get('admin/shops')
  async getShops(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) {
      throw new UnauthorizedException(
        'Access denied. VIEW_SHOPS permission required.',
      );
    }
    return this.catalogService.getShops();
  }

  @Get('admin/shops/:id')
  async getShopDetail(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_SHOPS')) {
      throw new UnauthorizedException(
        'Access denied. VIEW_SHOPS permission required.',
      );
    }
    return this.catalogService.getShopDetail(id);
  }

  @Patch('admin/shops/:id')
  async updateShop(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      plan?: string;
      status?: string;
      description?: string;
    },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'ONBOARD_SHOP')) {
      throw new UnauthorizedException(
        'Access denied. ONBOARD_SHOP permission required.',
      );
    }
    return this.catalogService.updateShop(id, dto);
  }

  @Delete('admin/shops/:id')
  async deleteShop(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'DELETE_SHOP')) {
      throw new UnauthorizedException(
        'Access denied. DELETE_SHOP permission required.',
      );
    }
    return this.catalogService.deleteShop(id);
  }

  @Post('admin/shops/:id/seed-demo')
  async seedDemoData(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'SEED_DEMO')) {
      throw new UnauthorizedException(
        'Access denied. SEED_DEMO permission required.',
      );
    }
    return this.catalogService.seedDemoData(id);
  }

  @Post('admin/shops/:id/delete-demo')
  async deleteDemoData(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'SEED_DEMO')) {
      throw new UnauthorizedException(
        'Access denied. SEED_DEMO permission required.',
      );
    }
    return this.catalogService.deleteDemoData(id);
  }

  // ── TENANT REQUESTS ───────────────────────────────────────────────────────
  @Get('admin/tenant-requests')
  async getTenantRequests(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'VIEW_REQUESTS')) {
      throw new UnauthorizedException(
        'Access denied. VIEW_REQUESTS permission required.',
      );
    }
    return this.catalogService.getTenantRequests();
  }

  @Post('admin/tenant-requests/:id/approve')
  async approveTenantRequest(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_REQUESTS')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_REQUESTS permission required.',
      );
    }
    return this.catalogService.approveTenantRequest(id);
  }

  @Post('admin/tenant-requests/:id/reject')
  async rejectTenantRequest(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_REQUESTS')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_REQUESTS permission required.',
      );
    }
    return this.catalogService.rejectTenantRequest(id);
  }

  @Delete('admin/tenant-requests/:id')
  async deleteTenantRequest(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_REQUESTS')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_REQUESTS permission required.',
      );
    }
    return this.catalogService.deleteTenantRequest(id);
  }

  // ── PLATFORM TEAM (MANAGE_TEAM ONLY) ─────────────────────────────────────────
  @Get('admin/team')
  async getPlatformTeam(@Req() req: AdminRequest) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_TEAM permission required.',
      );
    }
    return this.catalogService.getPlatformTeam();
  }

  @Get('admin/team/:id')
  async getPlatformAdmin(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_TEAM permission required.',
      );
    }
    return this.catalogService.getPlatformAdmin(id);
  }

  @Post('admin/team')
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
      throw new UnauthorizedException(
        'Access denied. MANAGE_TEAM permission required.',
      );
    }
    return this.catalogService.createPlatformAdmin(dto);
  }

  @Patch('admin/team/:id')
  async updatePlatformAdmin(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: { status?: string; permissions?: string[] },
  ) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_TEAM permission required.',
      );
    }
    return this.catalogService.updatePlatformAdmin(id, dto);
  }

  @Delete('admin/team/:id')
  async deletePlatformAdmin(@Req() req: AdminRequest, @Param('id') id: string) {
    await this.verifyAdmin(req);
    if (!hasPermission(req.admin!, 'MANAGE_TEAM')) {
      throw new UnauthorizedException(
        'Access denied. MANAGE_TEAM permission required.',
      );
    }
    return this.catalogService.deletePlatformAdmin(id);
  }
}
