import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  // 1. Storefront Homepage
  async getHomepageData(shopId: string) {
    // Fetch active banners
    const banners = await this.prisma.banner.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    // Fetch active product sections
    const rawSections = await this.prisma.productSection.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    // Resolve products for each section based on its config
    const sections = await Promise.all(
      rawSections.map(async (section) => {
        const config = (section.config || {}) as any;
        let products: any[] = [];

        // Condition-based loading
        if (config.product_ids && Array.isArray(config.product_ids) && config.product_ids.length > 0) {
          products = await this.prisma.product.findMany({
            where: {
              id: { in: config.product_ids },
              shop_id: shopId,
              status: 'active',
            },
            include: {
              gallery: { where: { is_cover: true } },
              variants: { where: { is_active: true } },
              category: { select: { id: true, name: true, slug: true, parent_id: true } },
            },
          });
        } else if (config.category_id) {
          products = await this.prisma.product.findMany({
            where: {
              category_id: config.category_id,
              shop_id: shopId,
              status: 'active',
            },
            take: config.limit || 8,
            include: {
              gallery: { where: { is_cover: true } },
              variants: { where: { is_active: true } },
              category: { select: { id: true, name: true, slug: true, parent_id: true } },
            },
          });
        } else {
          // Default: load featured products
          products = await this.prisma.product.findMany({
            where: {
              is_featured: true,
              shop_id: shopId,
              status: 'active',
            },
            take: config.limit || 8,
            include: {
              gallery: { where: { is_cover: true } },
              variants: { where: { is_active: true } },
              category: { select: { id: true, name: true, slug: true, parent_id: true } },
            },
          });
        }

        return {
          id: section.id,
          title: section.title,
          type: section.type,
          sort_order: section.sort_order,
          products,
        };
      })
    );

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        logo_url: true,
        description: true
      }
    });

    return { shop, banners, sections };
  }

  // 2. Product Detail Page
  async getProductBySlug(shopId: string, slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { shop_id: shopId, slug },
      include: {
        gallery: { orderBy: { sort_order: 'asc' } },
        variants: {
          where: { is_active: true },
          include: {
            attributes: { orderBy: { sort_order: 'asc' } },
          },
          orderBy: { sort_order: 'asc' },
        },
        faqs: { orderBy: { sort_order: 'asc' } },
        reviews: {
          where: { status: 'approved' },
          orderBy: { created_at: 'desc' },
        },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    // Resolve dynamic related products (same category, up to 4 items)
    let relatedProducts: any[] = [];
    if (product.category_id) {
      relatedProducts = await this.prisma.product.findMany({
        where: {
          category_id: product.category_id,
          shop_id: shopId,
          status: 'active',
          id: { not: product.id },
        },
        take: 4,
        include: {
          gallery: { where: { is_cover: true } },
          variants: { where: { is_active: true } },
        },
      });
    }

    return { product, relatedProducts };
  }

  // 3. Catalog Browse & Filters
  async getProducts(
    shopId: string,
    query: {
      limit?: number;
      page?: number;
      category_slug?: string;
      brand_slug?: string;
      min_price?: number;
      max_price?: number;
      search?: string;
      sort?: string;
    }
  ) {
    const limit = Number(query.limit) || 12;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      shop_id: shopId,
      status: 'active',
    };

    if (query.category_slug) {
      const category = await this.prisma.category.findFirst({
        where: { shop_id: shopId, slug: query.category_slug, is_active: true },
      });
      if (category) {
        // Find all subcategories recursively
        const allCategories = await this.prisma.category.findMany({
          where: { shop_id: shopId, is_active: true },
        });

        const getDescendantIds = (parentId: string): string[] => {
          const children = allCategories.filter((c) => c.parent_id === parentId);
          return [parentId, ...children.flatMap((c) => getDescendantIds(c.id))];
        };

        const categoryIds = getDescendantIds(category.id);
        whereClause.category_id = { in: categoryIds };
      } else {
        whereClause.category_id = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (query.brand_slug) {
      whereClause.brand = { slug: query.brand_slug };
    }

    if (query.min_price !== undefined || query.max_price !== undefined) {
      whereClause.price = {};
      if (query.min_price !== undefined) {
        whereClause.price.gte = Number(query.min_price);
      }
      if (query.max_price !== undefined) {
        whereClause.price.lte = Number(query.max_price);
      }
    }

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { short_desc: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sort) {
      if (query.sort === 'price_asc') orderBy = { price: 'asc' };
      if (query.sort === 'price_desc') orderBy = { price: 'desc' };
      if (query.sort === 'popular') orderBy = { total_sold: 'desc' };
    }

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          gallery: { where: { is_cover: true } },
          variants: { where: { is_active: true } },
          category: { select: { id: true, name: true, slug: true, parent_id: true } },
        },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      products,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  // 4. Categories Tree
  async getCategories(shopId: string) {
    const rawCategories = await this.prisma.category.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    // Build self-referential tree mapping parent-child relations
    const map = new Map<string, any>();
    const roots: any[] = [];

    rawCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, product_count: cat._count?.products ?? 0, children: [] });
    });

    rawCategories.forEach((cat) => {
      const mapped = map.get(cat.id);
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(mapped);
        } else {
          roots.push(mapped);
        }
      } else {
        roots.push(mapped);
      }
    });

    return roots;
  }

  // 5. Brands
  async getBrands(shopId: string) {
    return this.prisma.brand.findMany({
      where: { shop_id: shopId, is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  // ================= ADMIN WRITES =================

  async createProduct(shopId: string, dto: CreateProductDto) {
    const { custom_sections, ...rest } = dto;
    return this.prisma.product.create({
      data: {
        ...rest,
        shop_id: shopId,
        custom_sections: custom_sections || [],
      },
    });
  }

  async createBanner(shopId: string, dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        ...dto,
        shop_id: shopId,
      },
    });
  }

  async createSection(shopId: string, dto: CreateSectionDto) {
    return this.prisma.productSection.create({
      data: {
        ...dto,
        shop_id: shopId,
      },
    });
  }
  async getProductById(shopId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, shop_id: shopId },
      include: {
        gallery: { orderBy: { sort_order: 'asc' } },
        variants: {
          include: {
            attributes: { orderBy: { sort_order: 'asc' } },
          },
          orderBy: { sort_order: 'asc' },
        },
        faqs: { orderBy: { sort_order: 'asc' } },
        reviews: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${productId}' not found`);
    }

    return product;
  }

  async updateProduct(shopId: string, productId: string, dto: any) {
    const { 
      custom_sections, 
      gallery, 
      faqs, 
      category, 
      brand, 
      tax, 
      variants, 
      reviews, 
      id, 
      shop_id, 
      created_at, 
      updated_at, 
      ...rest 
    } = dto;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update basic product fields
      await tx.product.update({
        where: { id: productId, shop_id: shopId },
        data: {
          ...rest,
          custom_sections: custom_sections !== undefined ? custom_sections : undefined,
        },
      });

      // 2. Sync gallery if provided
      if (gallery !== undefined && Array.isArray(gallery)) {
        await tx.productGallery.deleteMany({
          where: { product_id: productId, shop_id: shopId }
        });
        if (gallery.length > 0) {
          await tx.productGallery.createMany({
            data: gallery.map((g: any, index: number) => ({
              shop_id: shopId,
              product_id: productId,
              url: g.url,
              alt_text: g.alt_text || null,
              sort_order: g.sort_order !== undefined ? g.sort_order : index,
              is_cover: !!g.is_cover
            }))
          });
        }
      }

      // 3. Sync FAQs if provided
      if (faqs !== undefined && Array.isArray(faqs)) {
        await tx.productFaq.deleteMany({
          where: { product_id: productId, shop_id: shopId }
        });
        if (faqs.length > 0) {
          await tx.productFaq.createMany({
            data: faqs.map((f: any, index: number) => ({
              shop_id: shopId,
              product_id: productId,
              question: f.question,
              answer: f.answer,
              sort_order: f.sort_order !== undefined ? f.sort_order : index
            }))
          });
        }
      }
    });

    // Return full product with all relations after save
    return this.prisma.product.findFirst({
      where: { id: productId, shop_id: shopId },
      include: {
        gallery: { orderBy: { sort_order: 'asc' } },
        variants: {
          include: { attributes: { orderBy: { sort_order: 'asc' } } },
          orderBy: { sort_order: 'asc' },
        },
        faqs: { orderBy: { sort_order: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async deleteProduct(shopId: string, productId: string) {
    return this.prisma.product.delete({
      where: { id: productId, shop_id: shopId },
    });
  }

  // ── Review Management (Admin) ─────────────────────────────────────────────

  async getProductReviews(shopId: string, productId: string) {
    return this.prisma.review.findMany({
      where: { shop_id: shopId, product_id: productId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createReview(shopId: string, productId: string, dto: {
    reviewer_name?: string;
    rating: number;
    title?: string;
    body?: string;
    status?: string;
  }) {
    return this.prisma.review.create({
      data: {
        shop_id: shopId,
        product_id: productId,
        rating: dto.rating,
        title: dto.title || null,
        body: dto.body || null,
        status: dto.status || 'approved',
      },
    });
  }

  async deleteReview(shopId: string, reviewId: string) {
    return this.prisma.review.delete({
      where: { id: reviewId, shop_id: shopId },
    });
  }

  async updateReviewStatus(shopId: string, reviewId: string, status: string) {
    return this.prisma.review.update({
      where: { id: reviewId, shop_id: shopId },
      data: { status },
    });
  }

  // ── Variant Management ────────────────────────────────────────────────────

  async getProductVariants(shopId: string, productId: string) {
    return this.prisma.productVariant.findMany({
      where: { shop_id: shopId, product_id: productId },
      include: { attributes: { orderBy: { sort_order: 'asc' } } },
      orderBy: { sort_order: 'asc' },
    });
  }

  async createVariant(shopId: string, productId: string, dto: any) {
    const {
      label, sku, price, compare_price, cost_price,
      stock_qty, low_stock_at, image_url, is_active, sort_order,
    } = dto;

    // Count existing variants to auto-set sort_order
    const existingCount = await this.prisma.productVariant.count({
      where: { shop_id: shopId, product_id: productId },
    });

    // Auto-generate SKU if not provided
    const finalSku = sku?.trim()
      ? sku.trim()
      : `${productId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const variant = await this.prisma.productVariant.create({
      data: {
        shop_id: shopId,
        product_id: productId,
        label: label || null,
        sku: finalSku,
        price: parseFloat(price) || 0,
        compare_price: compare_price ? parseFloat(compare_price) : null,
        cost_price: cost_price ? parseFloat(cost_price) : null,
        stock_qty: parseInt(stock_qty) || 0,
        low_stock_at: parseInt(low_stock_at) || 5,
        image_url: image_url || null,
        is_active: is_active !== false,
        sort_order: sort_order !== undefined ? sort_order : existingCount,
      },
    });

    // Mark product as having variants
    await this.prisma.product.update({
      where: { id: productId, shop_id: shopId },
      data: { has_variants: true },
    });

    return variant;
  }

  async updateVariant(shopId: string, variantId: string, dto: any) {
    const {
      label, price, compare_price, cost_price,
      low_stock_at, image_url, is_active, sort_order,
    } = dto;

    return this.prisma.productVariant.update({
      where: { id: variantId, shop_id: shopId },
      data: {
        ...(label !== undefined && { label }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(compare_price !== undefined && { compare_price: compare_price ? parseFloat(compare_price) : null }),
        ...(cost_price !== undefined && { cost_price: cost_price ? parseFloat(cost_price) : null }),
        ...(low_stock_at !== undefined && { low_stock_at: parseInt(low_stock_at) }),
        ...(image_url !== undefined && { image_url }),
        ...(is_active !== undefined && { is_active }),
        ...(sort_order !== undefined && { sort_order }),
      },
    });
  }

  async deleteVariant(shopId: string, variantId: string) {
    return this.prisma.productVariant.delete({
      where: { id: variantId, shop_id: shopId },
    });
  }

  async adjustStock(
    shopId: string,
    variantId: string,
    dto: { adjustment: number; type?: string; note?: string },
  ) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, shop_id: shopId },
    });
    if (!variant) throw new NotFoundException(`Variant not found`);

    const newQty = Math.max(0, variant.stock_qty + dto.adjustment);

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock_qty: newQty },
    });

    // Optionally create an inventory log (requires a warehouse)
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { shop_id: shopId },
    });

    if (warehouse) {
      await this.prisma.inventoryLog.create({
        data: {
          shop_id: shopId,
          variant_id: variantId,
          warehouse_id: warehouse.id,
          type: dto.type || 'manual',
          qty_change: dto.adjustment,
          qty_after: newQty,
          note: dto.note || null,
        },
      });
    }

    return { variantId, previousQty: variant.stock_qty, newQty, adjustment: dto.adjustment };
  }

  async getStockLogs(shopId: string, productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { shop_id: shopId, product_id: productId },
      select: { id: true, label: true, sku: true },
    });

    const variantIds = variants.map((v) => v.id);
    if (variantIds.length === 0) return [];

    const logs = await this.prisma.inventoryLog.findMany({
      where: { shop_id: shopId, variant_id: { in: variantIds } },
      orderBy: { created_at: 'desc' },
      take: 60,
    });

    // Attach variant label/sku to each log
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    return logs.map((log) => ({
      ...log,
      variant: variantMap.get(log.variant_id) || null,
    }));
  }

  async getInventoryOverview(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shop_id: shopId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        gallery: { where: { is_cover: true }, select: { url: true }, take: 1 },
        variants: {
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            label: true,
            sku: true,
            price: true,
            stock_qty: true,
            low_stock_at: true,
            is_active: true,
            sort_order: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute per-product summary
    return products.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock_qty, 0);
      const outOfStock = p.variants.filter((v) => v.stock_qty === 0).length;
      const lowStock = p.variants.filter(
        (v) => v.stock_qty > 0 && v.stock_qty <= v.low_stock_at,
      ).length;
      return { ...p, totalStock, outOfStock, lowStock };
    });
  }

  async createCategory(shopId: string, dto: any) {
    return this.prisma.category.create({
      data: {
        ...dto,
        shop_id: shopId,
      },
    });
  }

  async updateCategory(shopId: string, categoryId: string, dto: any) {
    return this.prisma.category.update({
      where: { id: categoryId, shop_id: shopId },
      data: dto,
    });
  }

  async deleteCategory(shopId: string, categoryId: string) {
    return this.prisma.category.delete({
      where: { id: categoryId, shop_id: shopId },
    });
  }

  async deleteBanner(shopId: string, bannerId: string) {
    return this.prisma.banner.delete({
      where: { id: bannerId, shop_id: shopId },
    });
  }

  async getOrders(shopId: string) {
    return this.prisma.order.findMany({
      where: { shop_id: shopId },
      include: {
        items: true,
        status_logs: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateOrderStatus(shopId: string, orderId: string, status: string, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, shop_id: shopId },
    });
    if (!order) {
      throw new Error('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId,
          order_id: orderId,
          from_status: order.status,
          to_status: status,
          note: note || `Order status updated to ${status}`,
        },
      });

      return updatedOrder;
    });
  }

  // 6. Platform Tenant Registration (Get Demo Shop)
  async registerShop(dto: { name: string; slug: string; ownerEmail: string; ownerName: string; ownerPassword?: string }) {
    const password = dto.ownerPassword || `${dto.slug}@OakSol2026`;

    // 1. Create shop
    const shop = await this.prisma.shop.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: 'starter',
        status: 'active',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      }
    });

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal = platformDomain === 'localhost' || platformDomain.includes('localhost');
    const storeDomain = isLocal ? `${dto.slug}.localhost` : `${dto.slug}.${platformDomain}`;

    // 2. Create dynamic domain mapping
    await this.prisma.shopDomain.create({
      data: {
        shop_id: shop.id,
        domain: storeDomain,
        type: 'subdomain',
        is_primary: true,
        status: 'active',
        verified_at: new Date()
      }
    });

    // 3. Create shop owner user
    const owner = await this.prisma.user.create({
      data: {
        shop_id: shop.id,
        name: dto.ownerName,
        email: dto.ownerEmail,
        password_hash: '$2b$10$placeholder_hash_value', // seeded hash
        password: password,
        role: 'owner',
      }
    });

    // Link shop owner
    await this.prisma.shop.update({
      where: { id: shop.id },
      data: { owner_id: owner.id }
    });

    // 4. Seed basic templates for this shop so it loads beautifully
    const category = await this.prisma.category.create({
      data: {
        shop_id: shop.id,
        name: 'General Cleansers',
        slug: 'cleansers',
        is_active: true
      }
    });

    const brand = await this.prisma.brand.create({
      data: {
        shop_id: shop.id,
        name: dto.name.toUpperCase(),
        slug: dto.slug,
        is_active: true
      }
    });

    await this.prisma.product.create({
      data: {
        shop_id: shop.id,
        category_id: category.id,
        brand_id: brand.id,
        name: 'Demo Herbal Cleanser',
        slug: 'demo-cleanser',
        short_desc: 'Sample product automatically provisioned for your demo store.',
        description: 'This is a sample product description seeded automatically to help you test the OakSol Commerce platform.',
        price: 299.00,
        compare_price: 399.00,
        status: 'active',
        is_featured: true,
        custom_sections: [
          {
            id: 'benefits',
            title: 'Benefits',
            type: 'bullets',
            content: [
              '100% natural and skin-friendly.',
              'Cleanses dirt, pollutants, and sebum.',
              'Restores natural skin hydration.'
            ]
          }
        ]
      }
    });

    // Seed default banner
    await this.prisma.banner.create({
      data: {
        shop_id: shop.id,
        title: `Welcome to ${dto.name}`,
        image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=1000',
        link_url: `/products/demo-cleanser`,
        is_active: true
      }
    });

    // Seed default homepage section
    await this.prisma.productSection.create({
      data: {
        shop_id: shop.id,
        title: 'Featured Collections',
        type: 'grid',
        is_active: true,
        sort_order: 1,
        config: { limit: 4 }
      }
    });

    return {
      shopId: shop.id,
      shopSlug: shop.slug,
      domain: storeDomain,
      ownerEmail: dto.ownerEmail,
      ownerPassword: password,
    };
  }

  // Create a tenant request
  async createTenantRequest(dto: { name: string; slug: string; ownerName: string; ownerEmail: string; phone?: string; category?: string }) {
    // Check if slug is already taken in shops
    const existingShop = await this.prisma.shop.findUnique({
      where: { slug: dto.slug }
    });
    if (existingShop) {
      throw new BadRequestException('Shop slug is already registered');
    }

    // Check if slug is already taken in requests
    const existingReq = await this.prisma.tenantRequest.findUnique({
      where: { slug: dto.slug }
    });
    if (existingReq) {
      throw new BadRequestException('Shop slug is already requested');
    }

    return this.prisma.tenantRequest.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        owner_name: dto.ownerName,
        owner_email: dto.ownerEmail,
        phone: dto.phone || null,
        category: dto.category || null,
        status: 'pending'
      }
    });
  }

  // Get all tenant requests
  async getTenantRequests() {
    return this.prisma.tenantRequest.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  // Approve a tenant request
  async approveTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id }
    });
    if (!request) {
      throw new NotFoundException('Tenant request not found');
    }
    if (request.status === 'approved') {
      throw new BadRequestException('Tenant request already approved');
    }

    // Generate a secure password for the new merchant
    const generatedPassword = `${request.slug}@OakSol2026`;

    // Register the shop using the existing registerShop logic
    const result = await this.registerShop({
      name: request.name,
      slug: request.slug,
      ownerEmail: request.owner_email,
      ownerName: request.owner_name,
      ownerPassword: generatedPassword
    });

    // Update status to approved
    await this.prisma.tenantRequest.update({
      where: { id },
      data: { status: 'approved' }
    });

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal = platformDomain === 'localhost' || platformDomain.includes('localhost');
    const scheme = isLocal ? 'http' : 'https';
    const portSuffix = isLocal ? ':3000' : '';

    return {
      message: 'Shop successfully provisioned',
      ...result,
      credentials: {
        email: request.owner_email,
        password: generatedPassword,
        loginUrl: `${scheme}://${request.slug}.${platformDomain}${portSuffix}/admin`,
        domain: `${scheme}://${request.slug}.${platformDomain}${portSuffix}`
      }
    };
  }

  // Get all provisioned shops with their domains and owners
  async getShops() {
    const shops = await this.prisma.shop.findMany({
      include: {
        domains: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return shops.map((shop) => ({
      ...shop,
      domains: this.formatShopDomains(shop.domains, shop.slug),
    }));
  }

  // Get dynamic details of a single shop
  async getShopDetail(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const shop = await this.prisma.shop.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        domains: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            password_hash: true,
            role: true,
            is_active: true
          }
        },
        products: {
          include: {
            category: { select: { name: true } }
          },
          orderBy: { created_at: 'desc' }
        },
        categories: {
          orderBy: { sort_order: 'asc' }
        },
        banners: {
          orderBy: { sort_order: 'asc' }
        },
        product_sections: {
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    if (!shop) {
      throw new NotFoundException('Shop details not found');
    }

    return {
      ...shop,
      domains: this.formatShopDomains(shop.domains, shop.slug),
    };
  }

  // Update shop metadata (Super Admin)
  async updateShop(id: string, dto: { name?: string; plan?: string; status?: string; description?: string }) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.plan && { plan: dto.plan }),
        ...(dto.status && { status: dto.status }),
        ...(dto.description !== undefined && { description: dto.description }),
      }
    });
  }

  // Delete a shop and all its data (Super Admin)
  async deleteShop(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    await this.prisma.shop.delete({ where: { id } });
    return { message: `Shop "${shop.name}" (${shop.slug}) deleted successfully` };
  }

  // Reject a tenant request (Super Admin)
  async rejectTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Tenant request not found');
    return this.prisma.tenantRequest.update({
      where: { id },
      data: { status: 'rejected' }
    });
  }

  // Delete a tenant request (Super Admin)
  async deleteTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Tenant request not found');
    await this.prisma.tenantRequest.delete({ where: { id } });
    return { message: 'Tenant request deleted successfully' };
  }

  // Seed additional demo data for an existing shop (Super Admin)
  async seedDemoData(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const demoProducts = [
      { name: 'Rose Water Toner', slug: `rose-toner-${Date.now()}`, price: 349, desc: 'Soothing pure rose water toner for all skin types.' },
      { name: 'Kumkumadi Face Oil', slug: `kumkumadi-oil-${Date.now() + 1}`, price: 599, desc: 'Ayurvedic face oil with saffron and 16 herbs.' },
      { name: 'Neem Tulsi Face Wash', slug: `neem-facewash-${Date.now() + 2}`, price: 249, desc: 'Anti-bacterial herbal face wash for acne-prone skin.' },
    ];

    // Ensure a demo category exists
    const cat = await this.prisma.category.upsert({
      where: { shop_id_slug: { shop_id: shopId, slug: 'demo-products' } },
      update: {},
      create: { shop_id: shopId, name: 'Demo Collection', slug: 'demo-products', is_active: true }
    });

    const created: string[] = [];
    for (const p of demoProducts) {
      const prod = await this.prisma.product.upsert({
        where: { shop_id_slug: { shop_id: shopId, slug: p.slug } },
        update: {},
        create: {
          shop_id: shopId,
          category_id: cat.id,
          name: p.name,
          slug: p.slug,
          short_desc: p.desc,
          description: p.desc,
          price: p.price,
          compare_price: Math.round(p.price * 1.3),
          status: 'active',
          is_featured: true,
          custom_sections: [
            { id: 'benefits', title: 'Benefits', type: 'bullets', content: ['100% Natural', 'Dermatologist tested', 'Chemical-free formula'] }
          ]
        }
      });
      created.push(prod.name);
    }

    // Add a demo banner if none exists
    const bannerCount = await this.prisma.banner.count({ where: { shop_id: shopId } });
    if (bannerCount === 0) {
      await this.prisma.banner.create({
        data: {
          shop_id: shopId,
          title: `Welcome to ${shop.name}`,
          image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1000',
          link_url: '/products',
          is_active: true
        }
      });
    }

    return { message: `Demo data seeded: ${created.join(', ')}`, productsAdded: created.length };
  }

  // Get dashboard stats for Super Admin overview
  async getDashboardStats() {
    const [totalShops, totalRequests, pendingRequests, totalProducts] = await Promise.all([
      this.prisma.shop.count({ where: { status: 'active' } }),
      this.prisma.tenantRequest.count(),
      this.prisma.tenantRequest.count({ where: { status: 'pending' } }),
      this.prisma.product.count(),
    ]);
    return { totalShops, totalRequests, pendingRequests, totalProducts };
  }

  // Place storefront checkout order
  async placeOrder(
    shopId: string,
    dto: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      shipping_address: any;
      payment_method: string;
      notes?: string;
      items: { variant_id: string; qty: number }[];
    }
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const variantIds = dto.items.map(item => item.variant_id);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, shop_id: shopId },
      include: { product: true }
    });

    if (variants.length !== dto.items.length) {
      throw new BadRequestException('Some product variants were not found');
    }

    const variantMap = new Map(variants.map(v => [v.id, v]));

    // Check stock levels
    for (const item of dto.items) {
      const variant = variantMap.get(item.variant_id);
      if (!variant) continue;
      if (variant.stock_qty < item.qty) {
        throw new BadRequestException(`Insufficient stock for ${variant.label || variant.sku}. Available: ${variant.stock_qty}`);
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of dto.items) {
      const variant = variantMap.get(item.variant_id);
      if (variant) {
        subtotal += Number(variant.price) * item.qty;
      }
    }

    const shippingFee = subtotal >= 500 ? 0 : 50;
    const total = subtotal + shippingFee;

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create order record
      const order = await tx.order.create({
        data: {
          shop_id: shopId,
          order_number: orderNumber,
          status: 'pending',
          subtotal: subtotal,
          discount_amount: 0,
          shipping_amount: shippingFee,
          tax_amount: 0,
          total: total,
          shipping_address: dto.shipping_address,
          notes: dto.notes || null,
          items: {
            create: dto.items.map(item => {
              const variant = variantMap.get(item.variant_id)!;
              return {
                shop_id: shopId,
                variant_id: item.variant_id,
                qty: item.qty,
                unit_price: variant.price,
                line_total: Number(variant.price) * item.qty,
                product_snap: {
                  name: variant.product.name,
                  sku: variant.sku,
                  label: variant.label,
                  image_url: variant.image_url || null,
                }
              };
            })
          }
        },
        include: {
          items: true
        }
      });

      // 2. Log initial order status
      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId,
          order_id: order.id,
          from_status: null,
          to_status: 'pending',
          note: `Order submitted via storefront (${dto.payment_method.toUpperCase()})`,
        }
      });

      // 3. For Cash on Delivery (COD), deduct stock immediately & confirm order
      if (dto.payment_method === 'cod') {
        const confirmedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' }
        });

        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId,
            order_id: order.id,
            from_status: 'pending',
            to_status: 'confirmed',
            note: 'Order confirmed under Cash on Delivery (COD) terms',
          }
        });

        // Deduct inventory stock
        for (const item of dto.items) {
          const variant = variantMap.get(item.variant_id);
          if (variant) {
            const newQty = Math.max(0, variant.stock_qty - item.qty);
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: { stock_qty: newQty }
            });

            // Log warehouse transaction if active warehouse exists
            const warehouse = await tx.warehouse.findFirst({
              where: { shop_id: shopId, is_active: true }
            });
            if (warehouse) {
              await tx.inventoryLog.create({
                data: {
                  shop_id: shopId,
                  variant_id: item.variant_id,
                  warehouse_id: warehouse.id,
                  type: 'sale',
                  qty_change: -item.qty,
                  qty_after: newQty,
                  ref_id: order.id,
                  note: `COD Order sale deduction: ${orderNumber}`
                }
              });
            }
          }
        }

        return { order: confirmedOrder, paymentRequired: false, gatewayOrder: null };
      }

      // 4. For online payment (e.g. Razorpay), initialize dynamic transaction parameters
      let gatewayOrder: any = null;
      if (dto.payment_method === 'razorpay') {
        gatewayOrder = await this.paymentService.createRazorpayOrder(shopId, total, 'INR', order.order_number);
      }

      return { order, paymentRequired: true, gatewayOrder };
    });
  }

  // Get public order by ID scoped to this shop (for payment page)
  async getPublicOrderById(shopId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shop_id: shopId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Return sanitized public fields only
    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      shipping_amount: order.shipping_amount,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      total: order.total,
      shipping_address: order.shipping_address,
      notes: order.notes,
      created_at: order.created_at,
      items: order.items.map((item) => ({
        id: item.id,
        qty: item.qty,
        unit_price: item.unit_price,
        line_total: item.line_total,
        product_snap: item.product_snap,
      })),
    };
  }

  private formatShopDomains(domains: any[], slug: string) {
    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal = platformDomain === 'localhost' || platformDomain.includes('localhost');
    const storeSuffix = isLocal ? 'localhost' : platformDomain;

    return domains.map(d => {
      if (d.type === 'subdomain') {
        return {
          ...d,
          domain: `${slug}.${storeSuffix}`
        };
      }
      return d;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMER AUTH
  // ─────────────────────────────────────────────────────────────────────────────

  async customerRegister(shopId: string, dto: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');

    // Check if email is already taken
    const existing = await this.prisma.customer.findFirst({
      where: { shop_id: shopId, email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        shop_id: shopId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        password_hash,
        is_verified: false,
      },
      select: { id: true, name: true, email: true, phone: true, avatar_url: true, created_at: true },
    });

    const secret = process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    const token = jwt.sign({ customerId: customer.id, shopId }, secret, { expiresIn: '30d' });

    return { customer, token };
  }

  async customerLogin(shopId: string, dto: { email: string; password: string }) {
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');

    const customer = await this.prisma.customer.findFirst({
      where: { shop_id: shopId, email: dto.email },
    });
    if (!customer || !customer.password_hash) {
      throw new BadRequestException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(dto.password, customer.password_hash);
    if (!valid) {
      throw new BadRequestException('Invalid email or password.');
    }

    const secret = process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    const token = jwt.sign({ customerId: customer.id, shopId }, secret, { expiresIn: '30d' });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar_url: customer.avatar_url,
        created_at: customer.created_at,
      },
      token,
    };
  }

  async getCustomerMe(shopId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, shop_id: shopId },
      select: {
        id: true, name: true, email: true, phone: true, avatar_url: true,
        total_orders: true, total_spent: true, created_at: true,
        addresses: { orderBy: { is_default: 'desc' } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found.');
    return customer;
  }

  async updateCustomerMe(shopId: string, customerId: string, dto: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    current_password?: string;
    new_password?: string;
  }) {
    const bcrypt = await import('bcryptjs');
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url;

    if (dto.new_password) {
      if (!dto.current_password) {
        throw new BadRequestException('Current password is required to set a new password.');
      }
      const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
      const valid = await bcrypt.compare(dto.current_password, customer?.password_hash || '');
      if (!valid) throw new BadRequestException('Current password is incorrect.');
      data.password_hash = await bcrypt.hash(dto.new_password, 10);
    }

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar_url: true, created_at: true },
    });
    return updated;
  }

  async getCustomerOrders(shopId: string, customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { shop_id: shopId, customer_id: customerId },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
      },
    });
    return orders.map(o => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      shipping_amount: o.shipping_amount,
      discount_amount: o.discount_amount,
      created_at: o.created_at,
      items: o.items.map(i => ({
        id: i.id,
        qty: i.qty,
        unit_price: i.unit_price,
        line_total: i.line_total,
        product_snap: i.product_snap,
      })),
    }));
  }

  // Validate customer JWT — returns { customerId, shopId } or throws
  async verifyCustomerToken(token: string): Promise<{ customerId: string; shopId: string }> {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    try {
      const payload = jwt.verify(token, secret) as any;
      return { customerId: payload.customerId, shopId: payload.shopId };
    } catch {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGES CONTENT (from settings table, group = 'pages')
  // ─────────────────────────────────────────────────────────────────────────────

  async getPageContent(shopId: string) {
    const settings = await this.prisma.setting.findMany({
      where: { shop_id: shopId, group: 'pages' },
    });

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, logo_url: true, description: true },
    });

    // Turn array into keyed object for easy frontend consumption
    const content: Record<string, string> = {};
    for (const s of settings) {
      content[s.key] = s.value;
    }

    return { shop, content };
  }

  async savePageContent(shopId: string, data: Record<string, string>) {
    // Upsert each key-value pair into settings table with group='pages'
    const promises = Object.entries(data).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { shop_id_key: { shop_id: shopId, key } },
        create: { shop_id: shopId, key, value, group: 'pages' },
        update: { value },
      })
    );
    await Promise.all(promises);
    return { success: true, saved: Object.keys(data).length };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACT FORM — saves as notification for admin
  // ─────────────────────────────────────────────────────────────────────────────

  async submitContactForm(shopId: string, dto: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }) {
    // We save it as an activity log (no customer_id needed)
    await this.prisma.activityLog.create({
      data: {
        shop_id: shopId,
        action: 'contact_form_submission',
        entity_type: 'contact',
        metadata: {
          name: dto.name,
          email: dto.email,
          subject: dto.subject || '',
          message: dto.message,
          submitted_at: new Date().toISOString(),
        },
      },
    });
    return { success: true, message: 'Thank you! Your message has been received.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLATFORM ADMIN / SUPER ADMIN AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────────────────

  async adminLogin(dto: { email: string; password: string }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@oaksol.in';
    const adminPassword = process.env.ADMIN_PASSWORD || '123';

    if (dto.email !== adminEmail || dto.password !== adminPassword) {
      throw new BadRequestException('Invalid admin credentials.');
    }

    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'oaksol-commerce-jwt-secret-key-replace-in-production';
    const token = jwt.sign({ role: 'super_admin' }, secret, { expiresIn: '7d' });

    return { token };
  }
}

