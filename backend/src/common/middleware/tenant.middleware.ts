import { Injectable, NestMiddleware, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { tenantLocalStorage, tenantPrismaClient } from '../../database/tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(
    req: Request & { shopId?: string },
    res: Response,
    next: NextFunction,
  ) {
    // Bypass tenant verification for merchant auth login
    if (req.method === 'POST' && req.path.endsWith('/merchant/auth/login')) {
      next();
      return;
    }

    const explicitSlug =
      (req.headers['x-shop-slug'] as string) ||
      (req.query.shop_slug as string) ||
      (req.query.shop as string);

    const tenantDomain =
      (req.headers['x-tenant-domain'] as string) || req.headers.host || '';

    const hostname = tenantDomain.split(':')[0];

    // Bypass for platform admin and API subdomains
    if (
      hostname === 'admin.localhost' ||
      hostname.startsWith('admin.') ||
      hostname === 'api.localhost' ||
      hostname.startsWith('api.')
    ) {
      next();
      return;
    }

    const platformDomain = process.env.PLATFORM_DOMAIN || 'gooak.shop';

    // Bypass for the SaaS platform landing page domain only
    if (hostname === platformDomain || hostname === `www.${platformDomain}`) {
      next();
      return;
    }

    let shopId: string | undefined;
    let shopSlug: string | undefined;

    // 1. First, check if explicit X-Shop-Slug or query parameter is provided
    if (explicitSlug) {
      const shop = await this.prisma.shop.findFirst({
        where: { slug: { equals: explicitSlug.trim(), mode: 'insensitive' } },
        select: { id: true, slug: true },
      });
      if (shop) {
        shopId = shop.id;
        shopSlug = shop.slug;
      }
    }

    // 2. Exact domain match in shop_domains registry (only verified/active domains)
    if (!shopId && hostname) {
      const domainRecord = await this.prisma.shopDomain.findFirst({
        where: { domain: { equals: hostname, mode: 'insensitive' }, status: 'active' },
        select: { shop_id: true },
      });

      if (domainRecord) {
        shopId = domainRecord.shop_id;
        const shop = await this.prisma.shop.findUnique({
          where: { id: shopId },
          select: { slug: true },
        });
        if (shop) shopSlug = shop.slug;
      }
    }

    // 3. Subdomain slug lookup or raw slug lookup (e.g. "nature-glow.localhost" or "nature-glow")
    if (!shopId && hostname) {
      const isSubdomain =
        hostname.endsWith(`.${platformDomain}`) || hostname.endsWith('.localhost');

      const potentialSlug = isSubdomain ? hostname.split('.')[0] : hostname;

      if (potentialSlug && potentialSlug !== 'localhost' && potentialSlug !== '127.0.0.1') {
        const shop = await this.prisma.shop.findFirst({
          where: { slug: { equals: potentialSlug, mode: 'insensitive' } },
          select: { id: true, slug: true },
        });
        if (shop) {
          shopId = shop.id;
          shopSlug = shop.slug;
        }
      }
    }

    // 4. Local dev fallback: resolve to testShop or first active shop
    if (!shopId && (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname)) {
      let fallbackShop = await this.prisma.shop.findFirst({
        where: { slug: { equals: 'testShop', mode: 'insensitive' } },
        select: { id: true, slug: true },
      });
      if (!fallbackShop) {
        fallbackShop = await this.prisma.shop.findFirst({
          where: { status: 'active' },
          select: { id: true, slug: true },
        });
      }
      if (fallbackShop) {
        shopId = fallbackShop.id;
        shopSlug = fallbackShop.slug;
      }
    }

    if (!shopId) {
      throw new NotFoundException(`Store domain mapping for '${explicitSlug || hostname}' not found`);
    }

    req.shopId = shopId;

    // Check subscription status — block expired/cancelled shops from serving requests
    // Platform routes (/platform/*) are already bypassed above so this only applies to tenant routes
    const subscription = await this.prisma.shopSubscription.findUnique({
      where: { shop_id: shopId },
      select: { status: true, current_period_end: true },
    });
    if (subscription) {
      const isExpired =
        subscription.current_period_end &&
        subscription.current_period_end < new Date();
      if (subscription.status === 'cancelled' || (subscription.status !== 'active' && isExpired)) {
        throw new HttpException('Shop subscription has expired. Please renew your plan.', HttpStatus.PAYMENT_REQUIRED);
      }
    }

    tenantLocalStorage.run(
      { tenantId: shopId, tenantSlug: shopSlug || '', client: tenantPrismaClient },
      () => { next(); },
    );
  }
}
