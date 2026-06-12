import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private tenantPrisma: TenantPrismaService,
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
    // Start clean with 0 Products, 0 Categories, 0 Banners, but 1 Homepage Section

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

  // Delete/Clear demo data for a shop (Super Admin)
  async deleteDemoData(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const categories = await this.prisma.category.findMany({
      where: {
        shop_id: shopId,
        slug: { in: ['demo-products', 'cleansers'] }
      },
      select: { id: true }
    });
    const categoryIds = categories.map(c => c.id);

    const productsToDelete = await this.prisma.product.findMany({
      where: {
        shop_id: shopId,
        OR: [
          { category_id: { in: categoryIds } },
          { slug: { startsWith: 'rose-toner-' } },
          { slug: { startsWith: 'kumkumadi-oil-' } },
          { slug: { startsWith: 'neem-facewash-' } },
          { slug: 'demo-cleanser' }
        ]
      },
      select: { id: true }
    });
    const productIds = productsToDelete.map(p => p.id);

    await this.prisma.$transaction(async (tx) => {
      if (productIds.length > 0) {
        await tx.product.deleteMany({
          where: { id: { in: productIds } }
        });
      }

      if (categoryIds.length > 0) {
        await tx.category.deleteMany({
          where: { id: { in: categoryIds } }
        });
      }

      await tx.banner.deleteMany({
        where: {
          shop_id: shopId,
          image_url: {
            in: [
              'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1000',
              'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=1000'
            ]
          }
        }
      });
    });

    return { message: 'Demo data deleted successfully', productsDeleted: productIds.length };
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

    // Link customer if they have an account
    const customer = await this.tenantPrisma.customer.findFirst({
      where: { shop_id: shopId, email: dto.customer_email }
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Create order record
      const order = await tx.order.create({
        data: {
          shop_id: shopId,
          customer_id: customer?.id || null,
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const order = await this.prisma.order.findFirst({
      where: isUuid
        ? { OR: [{ id: orderId }, { order_number: orderId }], shop_id: shopId }
        : { order_number: orderId, shop_id: shopId },
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
    const defaultEmail = process.env.ADMIN_EMAIL || 'admin@oaksol.in';
    const defaultPassword = process.env.ADMIN_PASSWORD || '123';

    // 1. Auto-bootstrap the default admin if the platform_admins table is empty
    const adminCount = await this.prisma.platformAdmin.count();
    if (adminCount === 0) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(defaultPassword, 10);
      await this.prisma.platformAdmin.create({
        data: {
          name: 'Platform Owner',
          email: defaultEmail,
          password_hash: hash,
          permissions: [
            'VIEW_SHOPS',
            'VIEW_STATS',
            'VIEW_REQUESTS',
            'ONBOARD_SHOP',
            'MANAGE_REQUESTS',
            'SEED_DEMO',
            'DELETE_SHOP',
            'MANAGE_TEAM'
          ],
          status: 'active',
        }
      });
      console.log(`[Auto-Bootstrap] Provisioned default Master Admin: ${defaultEmail}`);
    }

    // 2. Query the admin from the database
    let admin = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email }
    });

    if (!admin || admin.status !== 'active') {
      throw new BadRequestException('Invalid admin credentials or inactive account.');
    }

    if (admin.email === defaultEmail) {
      const allPermissions = [
        'VIEW_SHOPS',
        'VIEW_STATS',
        'VIEW_REQUESTS',
        'ONBOARD_SHOP',
        'MANAGE_REQUESTS',
        'SEED_DEMO',
        'DELETE_SHOP',
        'MANAGE_TEAM'
      ];
      if (!admin.permissions || admin.permissions.length === 0) {
        admin = await this.prisma.platformAdmin.update({
          where: { id: admin.id },
          data: { permissions: allPermissions }
        });
      }
    }

    // 3. Verify password hash
    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.compare(dto.password, admin.password_hash);
    if (!isMatch) {
      throw new BadRequestException('Invalid admin credentials.');
    }

    // 4. Sign JWT token
    const secret = process.env.JWT_SECRET || 'oaksol-commerce-jwt-secret-key-replace-in-production';
    const token = jwt.sign(
      { 
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'super_admin',
        permissions: admin.permissions || []
      }, 
      secret, 
      { expiresIn: '7d' }
    );

    return { 
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions || []
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLATFORM TEAM MANAGEMENT (MANAGE_TEAM ONLY)
  // ─────────────────────────────────────────────────────────────────────────────

  async getPlatformAdmin(id: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true
      }
    });
    if (!admin) throw new NotFoundException('Administrator not found.');
    return admin;
  }

  async getPlatformTeam() {
    return this.prisma.platformAdmin.findMany({
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true
      }
    });
  }

  async createPlatformAdmin(dto: { name: string; email: string; password?: string; permissions?: string[] }) {
    const existing = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email }
    });
    if (existing) {
      throw new BadRequestException('Administrator with this email already exists.');
    }

    const password = dto.password || 'OaksolAdmin2026';
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    return this.prisma.platformAdmin.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash: hash,
        permissions: dto.permissions || [],
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true
      }
    });
  }

  async updatePlatformAdmin(id: string, dto: { status?: string; permissions?: string[] }) {
    const targetAdmin = await this.prisma.platformAdmin.findUnique({
      where: { id }
    });
    if (!targetAdmin) {
      throw new NotFoundException('Administrator not found.');
    }

    // Protect Master Admin from downgrade/status change by others
    if (targetAdmin.email === 'admin@oaksol.in') {
      throw new BadRequestException('Cannot modify the primary owner.');
    }

    const updatedData: any = {};
    if (dto.status !== undefined) {
      updatedData.status = dto.status;
    }
    if (dto.permissions !== undefined) {
      updatedData.permissions = dto.permissions;
    }

    return this.prisma.platformAdmin.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true
      }
    });
  }

  async deletePlatformAdmin(id: string) {
    const targetAdmin = await this.prisma.platformAdmin.findUnique({
      where: { id }
    });
    if (!targetAdmin) {
      throw new NotFoundException('Administrator not found.');
    }

    if (targetAdmin.email === 'admin@oaksol.in') {
      throw new BadRequestException('Cannot delete the primary owner.');
    }

    await this.prisma.platformAdmin.delete({
      where: { id }
    });

    return { success: true };
  }

  // Merchant / Store Owner Login (Shopify Style - resolves shop by email lookup)
  async merchantLogin(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.trim().toLowerCase() },
      include: { shop: true }
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password.');
    }

    // Check plain password (dev mode) or bcrypt hash (prod mode)
    let isMatch = false;
    if (user.password && user.password === dto.password) {
      isMatch = true;
    } else {
      const bcrypt = await import('bcryptjs');
      isMatch = await bcrypt.compare(dto.password, user.password_hash).catch(() => false);
    }

    if (!isMatch) {
      throw new BadRequestException('Invalid email or password.');
    }

    if (!user.shop || user.shop.status !== 'active') {
      throw new BadRequestException('Shop is inactive or not found.');
    }

    return {
      success: true,
      shop: {
        id: user.shop.id,
        name: user.shop.name,
        slug: user.shop.slug
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
}
