import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { TenantConnectionPoolService } from '../../database/tenant-connection-pool.service';
import { tenantLocalStorage } from '../../database/tenant-context';

/**
 * TenantMiddleware is responsible for inspecting incoming requests,
 * resolving the tenant (shop) associated with the request hostname,
 * and establishing the tenant-specific Prisma Client context using AsyncLocalStorage.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private tenantConnectionPool: TenantConnectionPoolService,
  ) {}

  async use(
    req: Request & { shopId?: string },
    res: Response,
    next: NextFunction,
  ) {
    // 1. Bypass tenant verification for merchant login
    // The merchant login endpoint resolves shop access by email and should not require a tenant domain mapping.
    if (req.method === 'POST' && req.path.endsWith('/catalog/merchant/login')) {
      next();
      return;
    }

    // Resolve domain/hostname from headers (or standard HTTP Host header)
    const tenantDomain =
      (req.headers['x-tenant-domain'] as string) || req.headers.host;

    if (!tenantDomain) {
      throw new NotFoundException(
        'Host header or X-Tenant-Domain header missing',
      );
    }

    // Extract hostname (remove port if exists, e.g., 'localhost:5001' -> 'localhost')
    const hostname = tenantDomain.split(':')[0];

    // 2. Bypass tenant verification for Platform Administrators or direct API subdomains
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

    // 3. Match the exact domain hostname in shop_domains registry (supports custom domains and exact matches)
    const domainRecord = await this.prisma.shopDomain.findFirst({
      where: {
        domain: {
          equals: hostname,
          mode: 'insensitive',
        },
      },
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
      // 4. Subdomain lookup (e.g., "nature-glow.localhost" or "nature-glow.posix.digital")
      const isSubdomain =
        hostname.endsWith(`.${platformDomain}`) ||
        hostname.endsWith('.localhost');

      if (isSubdomain) {
        // Extract the subdomain slug (first segment before the dot)
        const slug = hostname.split('.')[0];
        const shop = await this.prisma.shop.findFirst({
          where: {
            slug: {
              equals: slug,
              mode: 'insensitive',
            },
          },
          select: { id: true, db_connection_url: true, slug: true },
        });
        if (shop) {
          shopId = shop.id;
          shopSlug = shop.slug;
          dbConnectionUrl = shop.db_connection_url;
        }
      }
    }

    // 5. Local development fallback: if domain is localhost/127.0.0.1 and not matched, fallback to testShop or first active shop
    if (!shopId && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      let fallbackShop = await this.prisma.shop.findFirst({
        where: { slug: { equals: 'testShop', mode: 'insensitive' } },
        select: { id: true, slug: true, db_connection_url: true },
      });
      if (!fallbackShop) {
        fallbackShop = await this.prisma.shop.findFirst({
          where: { status: 'active' },
          select: { id: true, slug: true, db_connection_url: true },
        });
      }
      if (fallbackShop) {
        shopId = fallbackShop.id;
        shopSlug = fallbackShop.slug;
        dbConnectionUrl = fallbackShop.db_connection_url;
      }
    }

    if (!shopId) {
      throw new NotFoundException(
        `Store domain mapping for '${hostname}' not found`,
      );
    }

    req.shopId = shopId;

    // 6. Resolve or create the dynamic connection string and client for this tenant
    const connectionString = dbConnectionUrl || process.env.DATABASE_URL!;
    const tenantClient =
      this.tenantConnectionPool.getTenantClient(connectionString);

    // 7. Store tenant details in AsyncLocalStorage context so downstream services can access the correct db client
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
