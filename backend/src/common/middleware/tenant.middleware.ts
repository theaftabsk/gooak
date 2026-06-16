import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { TenantConnectionPoolService } from '../../database/tenant-connection-pool.service';
import { tenantLocalStorage } from '../../database/tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private tenantConnectionPool: TenantConnectionPoolService,
  ) {}

  async use(req: Request & { shopId?: string }, res: Response, next: NextFunction) {
    // The merchant login endpoint resolves shop access by email and should not require a tenant domain mapping.
    if (req.method === 'POST' && req.path === '/catalog/merchant/login') {
      next();
      return;
    }

    const tenantDomain = (req.headers['x-tenant-domain'] as string) || req.headers.host;

    if (!tenantDomain) {
      throw new NotFoundException('Host header or X-Tenant-Domain header missing');
    }

    // Extract hostname (remove port if exists)
    const hostname = tenantDomain.split(':')[0];

    // If it is the platform admin or API subdomain, bypass tenant verification
    if (
      hostname === 'admin.localhost' || 
      hostname.startsWith('admin.') ||
      hostname === 'api.localhost' ||
      hostname.startsWith('api.')
    ) {
      next();
      return;
    }

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';

    // SaaS platform landing page domains bypass tenant checks (public endpoints)
    if (
      hostname === platformDomain ||
      hostname === `www.${platformDomain}` ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'www.localhost'
    ) {
      next();
      return;
    }

    let shopId: string | undefined;
    let shopSlug: string | undefined;
    let dbConnectionUrl: string | null | undefined;

    // 1. Try to match the exact domain hostname in shop_domains (works for custom domains and exact matches)
    const domainRecord = await this.prisma.shopDomain.findUnique({
      where: { domain: hostname },
      select: { shop_id: true },
    });

    if (domainRecord) {
      shopId = domainRecord.shop_id;
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        select: { slug: true, db_connection_url: true },
      });
      if (shop) {
        shopSlug = shop.slug;
        dbConnectionUrl = shop.db_connection_url;
      }
    } else {
      // 2. If no exact match, check if it's a subdomain slug
      const isSubdomain = hostname.endsWith(`.${platformDomain}`) || hostname.endsWith('.localhost');
      
      if (isSubdomain) {
        // Extract the subdomain slug (e.g., "nature-glow" from "nature-glow.posix.digital" or "nature-glow.localhost")
        const slug = hostname.split('.')[0];
        const shop = await this.prisma.shop.findUnique({
          where: { slug },
          select: { id: true, db_connection_url: true },
        });
        if (shop) {
          shopId = shop.id;
          shopSlug = slug;
          dbConnectionUrl = shop.db_connection_url;
        }
      }
    }

    // Local development fallback: if domain registry not matched, fallback to first active shop
    if (!shopId && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      const fallbackShop = await this.prisma.shop.findFirst({
        where: { status: 'active' },
        select: { id: true, slug: true, db_connection_url: true },
      });
      if (fallbackShop) {
        shopId = fallbackShop.id;
        shopSlug = fallbackShop.slug;
        dbConnectionUrl = fallbackShop.db_connection_url;
      }
    }

    if (!shopId) {
      throw new NotFoundException(`Store domain mapping for '${hostname}' not found`);
    }

    req.shopId = shopId;

    // Resolve tenant database connection string (fallback to central DB if not specified)
    const connectionString = dbConnectionUrl || process.env.DATABASE_URL!;
    const tenantClient = this.tenantConnectionPool.getTenantClient(connectionString);

    tenantLocalStorage.run(
      {
        tenantId: shopId,
        tenantSlug: shopSlug || '',
        client: tenantClient,
      },
      () => {
        next();
      },
    );
  }
}
