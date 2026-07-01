import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getHomepageData(shopId: string) {
    const banners = await this.prisma.banner.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    const rawSections = await this.prisma.productSection.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    const sections = await Promise.all(
      rawSections.map(async (section) => {
        const config = (section.config || {}) as any;
        let products: any[] = [];

        const productInclude = {
          gallery: { where: { is_cover: true } },
          variants: { where: { is_active: true } },
          category: { select: { id: true, name: true, slug: true, parent_id: true } },
        };

        if (config.product_ids?.length > 0) {
          products = await this.prisma.product.findMany({
            where: { id: { in: config.product_ids }, shop_id: shopId, status: 'published' },
            include: productInclude,
          });
        } else if (config.category_id) {
          products = await this.prisma.product.findMany({
            where: { category_id: config.category_id, shop_id: shopId, status: 'published' },
            take: config.limit || 8,
            include: productInclude,
          });
        } else {
          products = await this.prisma.product.findMany({
            where: { is_featured: true, shop_id: shopId, status: 'published' },
            take: config.limit || 8,
            include: productInclude,
          });
        }

        return { id: section.id, title: section.title, type: section.type, sort_order: section.sort_order, products };
      }),
    );

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, logo_url: true, description: true, currency: true, slug: true, owner: { select: { email: true, name: true } } },
    });

    const themeSettings = await this.prisma.setting.findMany({
      where: { shop_id: shopId, key: { in: ['theme_industry', 'theme_style'] } },
    });

    return {
      shop: {
        ...shop,
        theme_industry: themeSettings.find((s) => s.key === 'theme_industry')?.value || 'fashion',
        theme_style: themeSettings.find((s) => s.key === 'theme_style')?.value || 'classic',
      },
      banners,
      sections,
    };
  }

  async getProducts(
    shopId: string,
    query: {
      limit?: number; page?: number; category_slug?: string; brand_slug?: string;
      min_price?: number; max_price?: number; search?: string; sort?: string;
    },
  ) {
    const limit = Number(query.limit) || 12;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const where: any = { shop_id: shopId, status: 'published' };

    if (query.category_slug) {
      const category = await this.prisma.category.findFirst({
        where: { shop_id: shopId, slug: query.category_slug, is_active: true },
      });
      if (category) {
        const allCats = await this.prisma.category.findMany({ where: { shop_id: shopId, is_active: true } });
        const collectIds = (pid: string): string[] => {
          const children = allCats.filter((c) => c.parent_id === pid);
          return [pid, ...children.flatMap((c) => collectIds(c.id))];
        };
        where.category_id = { in: collectIds(category.id) };
      } else {
        where.category_id = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (query.brand_slug) where.brand = { slug: query.brand_slug };
    if (query.min_price !== undefined || query.max_price !== undefined) {
      where.price = {};
      if (query.min_price !== undefined) where.price.gte = Number(query.min_price);
      if (query.max_price !== undefined) where.price.lte = Number(query.max_price);
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { short_desc: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    if (query.sort === 'popular') orderBy = { total_sold: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy, skip, take: limit,
        include: {
          gallery: { where: { is_cover: true } },
          variants: { where: { is_active: true } },
          category: { select: { id: true, name: true, slug: true, parent_id: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, pagination: { totalItems: total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  async getProductBySlug(shopId: string, slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { shop_id: shopId, slug },
      include: {
        gallery: { orderBy: { sort_order: 'asc' } },
        variants: {
          where: { is_active: true },
          include: { attributes: { orderBy: { sort_order: 'asc' } } },
          orderBy: { sort_order: 'asc' },
        },
        faqs: { orderBy: { sort_order: 'asc' } },
        reviews: { where: { status: 'approved' }, orderBy: { created_at: 'desc' } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) throw new NotFoundException(`Product '${slug}' not found`);

    let relatedProducts: any[] = [];
    if (product.category_id) {
      relatedProducts = await this.prisma.product.findMany({
        where: { category_id: product.category_id, shop_id: shopId, status: 'published', id: { not: product.id } },
        take: 4,
        include: { gallery: { where: { is_cover: true } }, variants: { where: { is_active: true } } },
      });
    }

    return { product, relatedProducts };
  }

  async getCategories(shopId: string) {
    const rawCategories = await this.prisma.category.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { sort_order: 'asc' },
      include: { _count: { select: { products: true } } },
    });

    const map = new Map<string, any>();
    const roots: any[] = [];

    rawCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, product_count: cat._count?.products ?? 0, children: [] });
    });

    rawCategories.forEach((cat) => {
      const node = map.get(cat.id);
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async getBrands(shopId: string) {
    return this.prisma.brand.findMany({ where: { shop_id: shopId, is_active: true }, orderBy: { name: 'asc' } });
  }

  async getCollections(shopId: string) {
    return this.prisma.collection.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async getCollectionBySlug(
    shopId: string,
    slug: string,
    query: { limit?: number; page?: number; sort?: string },
  ) {
    const collection = await this.prisma.collection.findFirst({ where: { shop_id: shopId, slug, is_active: true } });
    if (!collection) throw new NotFoundException(`Collection '${slug}' not found`);

    const limit = Number(query.limit) || 12;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    let orderBy: any = { created_at: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    if (query.sort === 'price_desc') orderBy = { price: 'desc' };
    if (query.sort === 'popular') orderBy = { total_sold: 'desc' };

    const where = {
      shop_id: shopId,
      status: 'published',
      collections: { some: { collection_id: collection.id } },
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy, skip, take: limit,
        include: {
          gallery: { where: { is_cover: true } },
          variants: { where: { is_active: true } },
          category: { select: { id: true, name: true, slug: true, parent_id: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { collection, products, pagination: { totalItems: total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  async getPublicSystemSettings() {
    return this.prisma.systemSetting.findMany({
      where: { is_public: true },
      select: { key: true, value: true, description: true },
    });
  }
}
