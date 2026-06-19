import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { TenantConnectionPoolService } from '../../database/tenant-connection-pool.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { PaymentService } from '../payment/payment.service';
import { TEMPLATES } from './templates';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private tenantPrisma: TenantPrismaService,
    private tenantConnectionPool: TenantConnectionPoolService,
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
        if (
          config.product_ids &&
          Array.isArray(config.product_ids) &&
          config.product_ids.length > 0
        ) {
          products = await this.prisma.product.findMany({
            where: {
              id: { in: config.product_ids },
              shop_id: shopId,
              status: 'active',
            },
            include: {
              gallery: { where: { is_cover: true } },
              variants: { where: { is_active: true } },
              category: {
                select: { id: true, name: true, slug: true, parent_id: true },
              },
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
              category: {
                select: { id: true, name: true, slug: true, parent_id: true },
              },
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
              category: {
                select: { id: true, name: true, slug: true, parent_id: true },
              },
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
      }),
    );

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        logo_url: true,
        description: true,
        currency: true,
        slug: true,
      },
    });

    const themeSettings = await this.prisma.setting.findMany({
      where: {
        shop_id: shopId,
        key: { in: ['theme_industry', 'theme_style'] },
      },
    });

    const shopWithTheme = {
      ...shop,
      theme_industry: themeSettings.find(s => s.key === 'theme_industry')?.value || 'fashion',
      theme_style: themeSettings.find(s => s.key === 'theme_style')?.value || 'classic',
    };

    return { shop: shopWithTheme, banners, sections };
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
    },
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
          const children = allCategories.filter(
            (c) => c.parent_id === parentId,
          );
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
          category: {
            select: { id: true, name: true, slug: true, parent_id: true },
          },
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
      map.set(cat.id, {
        ...cat,
        product_count: cat._count?.products ?? 0,
        children: [],
      });
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
          custom_sections:
            custom_sections !== undefined ? custom_sections : undefined,
        },
      });

      // 2. Sync gallery if provided
      if (gallery !== undefined && Array.isArray(gallery)) {
        await tx.productGallery.deleteMany({
          where: { product_id: productId, shop_id: shopId },
        });
        if (gallery.length > 0) {
          await tx.productGallery.createMany({
            data: gallery.map((g: any, index: number) => ({
              shop_id: shopId,
              product_id: productId,
              url: g.url,
              alt_text: g.alt_text || null,
              sort_order: g.sort_order !== undefined ? g.sort_order : index,
              is_cover: !!g.is_cover,
            })),
          });
        }
      }

      // 3. Sync FAQs if provided
      if (faqs !== undefined && Array.isArray(faqs)) {
        await tx.productFaq.deleteMany({
          where: { product_id: productId, shop_id: shopId },
        });
        if (faqs.length > 0) {
          await tx.productFaq.createMany({
            data: faqs.map((f: any, index: number) => ({
              shop_id: shopId,
              product_id: productId,
              question: f.question,
              answer: f.answer,
              sort_order: f.sort_order !== undefined ? f.sort_order : index,
            })),
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
      label,
      sku,
      price,
      compare_price,
      cost_price,
      stock_qty,
      low_stock_at,
      image_url,
      is_active,
      sort_order,
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
      label,
      price,
      compare_price,
      cost_price,
      low_stock_at,
      image_url,
      is_active,
      sort_order,
    } = dto;

    return this.prisma.productVariant.update({
      where: { id: variantId, shop_id: shopId },
      data: {
        ...(label !== undefined && { label }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(compare_price !== undefined && {
          compare_price: compare_price ? parseFloat(compare_price) : null,
        }),
        ...(cost_price !== undefined && {
          cost_price: cost_price ? parseFloat(cost_price) : null,
        }),
        ...(low_stock_at !== undefined && {
          low_stock_at: parseInt(low_stock_at),
        }),
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

  async updateOrderStatus(
    shopId: string,
    orderId: string,
    status: string,
    note?: string,
  ) {
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
  async registerShop(dto: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerName: string;
    ownerPassword?: string;
    industry?: string;
    theme?: string;
  }) {
    const password = dto.ownerPassword || `${dto.slug}@OakSol2026`;
    const bcrypt = await import('bcryptjs');
    const ownerHash = await bcrypt.hash(password, 10);

    const industryKey = (dto.industry || 'fashion').toLowerCase();
    const themeKey = (dto.theme || 'classic').toLowerCase();

    const selectedIndustry = TEMPLATES[industryKey] || TEMPLATES.fashion;
    const selectedTemplate = selectedIndustry[themeKey] || Object.values(selectedIndustry)[0];

    const themeColors = {
      primaryColor: selectedTemplate.theme.primaryColor,
      secondaryColor: selectedTemplate.theme.secondaryColor,
      backgroundColor: selectedTemplate.theme.backgroundColor,
      fontFamily: selectedTemplate.theme.fontFamily || 'Inter, sans-serif'
    };

    // 1. Create shop
    const shop = await this.prisma.shop.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: 'starter',
        status: 'active',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal =
      platformDomain === 'localhost' || platformDomain.includes('localhost');
    const storeDomain = isLocal
      ? `${dto.slug}.localhost`
      : `${dto.slug}.${platformDomain}`;

    // 2. Create dynamic domain mapping
    await this.prisma.shopDomain.create({
      data: {
        shop_id: shop.id,
        domain: storeDomain,
        type: 'subdomain',
        is_primary: true,
        status: 'active',
        verified_at: new Date(),
      },
    });

    // 3. Create shop owner user
    const owner = await this.prisma.user.create({
      data: {
        shop_id: shop.id,
        name: dto.ownerName,
        email: dto.ownerEmail,
        password_hash: ownerHash,
        password: password,
        role: 'owner',
      },
    });

    // Link shop owner
    await this.prisma.shop.update({
      where: { id: shop.id },
      data: { owner_id: owner.id },
    });

    // 4. Seed basic shop settings in settings table
    const defaultSettings = [
      { shop_id: shop.id, key: 'store_name', value: dto.name, group: 'general' },
      { shop_id: shop.id, key: 'store_email', value: dto.ownerEmail, group: 'general' },
      { shop_id: shop.id, key: 'store_currency', value: 'INR', group: 'general' },
      { shop_id: shop.id, key: 'store_timezone', value: 'Asia/Kolkata', group: 'general' },
      { shop_id: shop.id, key: 'store_status', value: 'active', group: 'general' },

      // Seeding header/footer layout options from selected template
      { shop_id: shop.id, key: 'announcement_bar', value: selectedTemplate.settings.announcement_bar || 'Welcome to our store!', group: 'pages' },
      { shop_id: shop.id, key: 'announcement_bar_active', value: selectedTemplate.settings.announcement_bar_active || 'true', group: 'pages' },
      { shop_id: shop.id, key: 'logo_url', value: '', group: 'pages' },
      { shop_id: shop.id, key: 'navbar_menu', value: JSON.stringify([
        { title: 'Home', url: '/' },
        { title: 'Products', url: '/products' },
        { title: 'Categories', url: '/categories' },
        { title: 'About Us', url: '/about' },
        { title: 'Contact Us', url: '/contact' }
      ]), group: 'pages' },
      { shop_id: shop.id, key: 'footer_menu', value: JSON.stringify([
        { title: 'Privacy Policy', url: '/privacy' },
        { title: 'Terms & Conditions', url: '/terms' },
        { title: 'Refund Policy', url: '/refund' },
        { title: 'Track Order', url: '/track-order' }
      ]), group: 'pages' },

      // About page settings
      { shop_id: shop.id, key: 'about_title', value: selectedTemplate.settings.about_title || 'About Our Brand', group: 'pages' },
      { shop_id: shop.id, key: 'about_tagline', value: selectedTemplate.settings.about_tagline || 'Crafted with passion', group: 'pages' },
      { shop_id: shop.id, key: 'about_content', value: selectedTemplate.settings.about_content || `Welcome to ${dto.name}. We provide high-quality items for all our customers.`, group: 'pages' },
      
      // Default contact settings
      { shop_id: shop.id, key: 'show_contact_email', value: 'true', group: 'pages' },
      { shop_id: shop.id, key: 'contact_email', value: dto.ownerEmail, group: 'pages' },
      { shop_id: shop.id, key: 'contact_email_desc', value: 'We reply to emails within 24 hours.', group: 'pages' },
      { shop_id: shop.id, key: 'show_contact_phone', value: 'true', group: 'pages' },
      { shop_id: shop.id, key: 'contact_phone', value: '+91 98765 43210', group: 'pages' },
      { shop_id: shop.id, key: 'contact_phone_desc', value: 'Available Mon-Fri, 9am - 6pm.', group: 'pages' },

      // Default policy pages content
      { shop_id: shop.id, key: 'privacy_updated', value: 'June 2026', group: 'pages' },
      { shop_id: shop.id, key: 'privacy_content', value: 'Your privacy is extremely important to us. We do not sell or share your personal information with third parties except as necessary to fulfill orders or comply with legal requests.', group: 'pages' },
      { shop_id: shop.id, key: 'terms_updated', value: 'June 2026', group: 'pages' },
      { shop_id: shop.id, key: 'terms_content', value: 'By accessing and purchasing from our storefront, you agree to comply with and be bound by our terms and conditions. All contents are property of our store.', group: 'pages' },
      { shop_id: shop.id, key: 'refund_updated', value: 'June 2026', group: 'pages' },
      { shop_id: shop.id, key: 'refund_content', value: 'We accept returns within 14 days of purchase. Items must be in original condition with tags attached. Refunds will be credited to the original payment method.', group: 'pages' },
    ];

    await this.prisma.setting.createMany({
      data: defaultSettings,
    });

    // 5. Seed default payment gateways
    await this.prisma.paymentGateway.createMany({
      data: [
        { shop_id: shop.id, name: 'Cash on Delivery', slug: 'cod', is_active: true, sort_order: 1 },
        { shop_id: shop.id, name: 'Razorpay', slug: 'razorpay', is_active: false, sort_order: 2, config: { key_id: '', key_secret: '' } },
      ],
    });

    // 6. Seed default warehouse
    await this.prisma.warehouse.create({
      data: {
        shop_id: shop.id,
        name: 'Main Warehouse',
        is_active: true,
      },
    });

    // 7. Seed default categories, products, variants
    const defaultCategory = await this.prisma.category.create({
      data: {
        shop_id: shop.id,
        name: 'New Arrivals',
        slug: 'new-arrivals',
        is_active: true,
      },
    });

    const defaultProduct = await this.prisma.product.create({
      data: {
        shop_id: shop.id,
        category_id: defaultCategory.id,
        name: 'Sample Product',
        slug: 'sample-product',
        short_desc: `This is a sample product for your ${dto.name} storefront.`,
        description: `This is a sample product created automatically to help you get started with your new ${dto.name} store.`,
        price: 99.00,
        compare_price: 129.00,
        status: 'active',
        is_featured: true,
        has_variants: true,
      },
    });

    await this.prisma.productVariant.create({
      data: {
        shop_id: shop.id,
        product_id: defaultProduct.id,
        sku: `SAMPLE-${dto.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        label: 'Default Variant',
        price: 99.00,
        stock_qty: 100,
        is_active: true,
      },
    });

    // Seed default homepage section
    await this.prisma.productSection.create({
      data: {
        shop_id: shop.id,
        title: 'Featured Collections',
        type: 'grid',
        is_active: true,
        sort_order: 1,
        config: { limit: 4 },
      },
    });

    // 8. Seed the standard 15 pages in the database and homepage widgets
    const reservedSlugs = [
      { slug: 'index', title: 'Home Page', type: 'home' },
      { slug: 'products', title: 'Products Page', type: 'products' },
      { slug: 'category', title: 'Category Details', type: 'category' },
      { slug: 'product', title: 'Product Details', type: 'product' },
      { slug: 'cart', title: 'Cart Page', type: 'cart' },
      { slug: 'checkout', title: 'Checkout Page', type: 'checkout' },
      { slug: 'about', title: 'About Us', type: 'about' },
      { slug: 'contact', title: 'Contact Us', type: 'contact' },
      { slug: 'privacy', title: 'Privacy Policy', type: 'privacy' },
      { slug: 'terms', title: 'Terms & Conditions', type: 'terms' },
      { slug: 'refund', title: 'Refund Policy', type: 'refund' },
      { slug: 'track-order', title: 'Track Order', type: 'track-order' },
      { slug: 'faq', title: 'Frequently Asked Questions', type: 'faq' },
      { slug: 'blog', title: 'Blog', type: 'blog' },
      { slug: 'shipping', title: 'Shipping Policy', type: 'shipping' },
    ];

    for (const pageInfo of reservedSlugs) {
      const page = await this.prisma.page.create({
        data: {
          shop_id: shop.id,
          title: pageInfo.title,
          slug: pageInfo.slug,
          type: pageInfo.type,
          theme: themeColors,
          is_published: true,
        },
      });

      // If it is the home page ('index'), seed the widgets from selectedTemplate.homepage
      if (pageInfo.slug === 'index') {
        if (selectedTemplate.homepage && selectedTemplate.homepage.length > 0) {
          await this.prisma.widget.createMany({
            data: selectedTemplate.homepage.map((w, index) => ({
              page_id: page.id,
              type: w.type,
              sort_order: index + 1,
              content: w.content || {},
              styles: w.styles || {},
            })),
          });
        }
      }
    }

    // 9. Provision & seed default customer in isolated tenant database
    const connectionString = shop.db_connection_url || process.env.DATABASE_URL!;

    if (shop.db_connection_url) {
      try {
        await this.tenantConnectionPool.provisionTenantDatabase(shop.db_connection_url);
      } catch (err) {
        console.error(`Provisioning tenant database failed for ${shop.slug}:`, err);
      }
    }

    try {
      const tenantClient = this.tenantConnectionPool.getTenantClient(connectionString);
      const customerHash = await bcrypt.hash('Customer@123', 10);
      await tenantClient.customer.create({
        data: {
          shop_id: shop.id,
          name: 'Demo Customer',
          email: `customer@${dto.slug}.localhost`,
          password_hash: customerHash,
          is_verified: true,
        },
      });
      console.log(`Successfully seeded tenant database default customer for ${shop.slug}`);
    } catch (err) {
      console.error(`Seeding default tenant customer failed for ${shop.slug}:`, err);
    }

    return {
      shopId: shop.id,
      shopSlug: shop.slug,
      domain: storeDomain,
      ownerEmail: dto.ownerEmail,
      ownerPassword: password,
    };
  }

  // Get public platform-wide settings
  async getPublicSystemSettings() {
    return this.prisma.systemSetting.findMany({
      where: { is_public: true },
      select: { key: true, value: true, description: true },
    });
  }

  // Create a tenant request
  async createTenantRequest(dto: {
    name: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    phone?: string;
    category?: string;
  }) {
    // Check if slug is already taken in shops
    const existingShop = await this.prisma.shop.findUnique({
      where: { slug: dto.slug },
    });
    if (existingShop) {
      throw new BadRequestException('Shop slug is already registered');
    }

    // Check if slug is already taken in requests
    const existingReq = await this.prisma.tenantRequest.findUnique({
      where: { slug: dto.slug },
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
        status: 'pending',
      },
    });
  }

  // Get all tenant requests
  async getTenantRequests() {
    return this.prisma.tenantRequest.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Approve a tenant request
  async approveTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Tenant request not found');
    }
    if (request.status === 'approved') {
      throw new BadRequestException('Tenant request already approved');
    }

    // Generate a secure password for the new merchant
    const generatedPassword = `${request.slug}@OakSol2026`;

    // Map request category to industry / theme
    let industry = 'fashion';
    let theme = 'classic';

    if (request.category) {
      const cat = request.category.toLowerCase();
      if (cat.includes('clothing') || cat.includes('fashion')) {
        industry = 'fashion';
        theme = 'classic';
      } else if (cat.includes('electronics')) {
        industry = 'electronics';
        theme = 'modern';
      } else if (cat.includes('food') || cat.includes('beverage') || cat.includes('restaurant')) {
        industry = 'restaurant';
        theme = 'cafe';
      } else if (cat.includes('living') || cat.includes('furniture')) {
        industry = 'furniture';
        theme = 'minimalist';
      } else if (cat.includes('wellness') || cat.includes('supplement') || cat.includes('pharmacy')) {
        industry = 'pharmacy';
        theme = 'wellness';
      } else if (cat.includes('skincare') || cat.includes('haircare') || cat.includes('beauty')) {
        industry = 'beauty';
        theme = 'organic';
      } else if (cat.includes('grocery') || cat.includes('market') || cat.includes('fruit')) {
        industry = 'grocery';
        theme = 'fresh';
      } else if (cat.includes('pet')) {
        industry = 'petstore';
        theme = 'playful';
      }
    }

    // Register the shop using the existing registerShop logic
    const result = await this.registerShop({
      name: request.name,
      slug: request.slug,
      ownerEmail: request.owner_email,
      ownerName: request.owner_name,
      ownerPassword: generatedPassword,
      industry,
      theme,
    });

    // Update status to approved
    await this.prisma.tenantRequest.update({
      where: { id },
      data: { status: 'approved' },
    });

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal =
      platformDomain === 'localhost' || platformDomain.includes('localhost');
    const scheme = isLocal ? 'http' : 'https';
    const portSuffix = isLocal ? ':3000' : '';

    return {
      message: 'Shop successfully provisioned',
      ...result,
      credentials: {
        email: request.owner_email,
        password: generatedPassword,
        loginUrl: `${scheme}://${request.slug}.${platformDomain}${portSuffix}/admin`,
        domain: `${scheme}://${request.slug}.${platformDomain}${portSuffix}`,
      },
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
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return shops.map((shop) => ({
      ...shop,
      domains: this.formatShopDomains(shop.domains, shop.slug),
    }));
  }

  // Get dynamic details of a single shop
  async getShopDetail(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
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
            is_active: true,
          },
        },
        products: {
          include: {
            category: { select: { name: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        categories: {
          orderBy: { sort_order: 'asc' },
        },
        banners: {
          orderBy: { sort_order: 'asc' },
        },
        product_sections: {
          orderBy: { sort_order: 'asc' },
        },
      },
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
  async updateShop(
    id: string,
    dto: {
      name?: string;
      plan?: string;
      status?: string;
      description?: string;
    },
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.plan && { plan: dto.plan }),
        ...(dto.status && { status: dto.status }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // Delete a shop and all its data (Super Admin)
  async deleteShop(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    await this.prisma.shop.delete({ where: { id } });
    return {
      message: `Shop "${shop.name}" (${shop.slug}) deleted successfully`,
    };
  }

  // Reject a tenant request (Super Admin)
  async rejectTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Tenant request not found');
    return this.prisma.tenantRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });
  }

  // Delete a tenant request (Super Admin)
  async deleteTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Tenant request not found');
    await this.prisma.tenantRequest.delete({ where: { id } });
    return { message: 'Tenant request deleted successfully' };
  }

  // Seed additional demo data for an existing shop (Super Admin)
  async seedDemoData(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const demoProducts = [
      {
        name: 'Rose Water Toner',
        slug: `rose-toner-${Date.now()}`,
        price: 349,
        desc: 'Soothing pure rose water toner for all skin types.',
      },
      {
        name: 'Kumkumadi Face Oil',
        slug: `kumkumadi-oil-${Date.now() + 1}`,
        price: 599,
        desc: 'Ayurvedic face oil with saffron and 16 herbs.',
      },
      {
        name: 'Neem Tulsi Face Wash',
        slug: `neem-facewash-${Date.now() + 2}`,
        price: 249,
        desc: 'Anti-bacterial herbal face wash for acne-prone skin.',
      },
    ];

    // Ensure a demo category exists
    const cat = await this.prisma.category.upsert({
      where: { shop_id_slug: { shop_id: shopId, slug: 'demo-products' } },
      update: {},
      create: {
        shop_id: shopId,
        name: 'Demo Collection',
        slug: 'demo-products',
        is_active: true,
      },
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
            {
              id: 'benefits',
              title: 'Benefits',
              type: 'bullets',
              content: [
                '100% Natural',
                'Dermatologist tested',
                'Chemical-free formula',
              ],
            },
          ],
        },
      });
      created.push(prod.name);
    }

    // Add a demo banner if none exists
    const bannerCount = await this.prisma.banner.count({
      where: { shop_id: shopId },
    });
    if (bannerCount === 0) {
      await this.prisma.banner.create({
        data: {
          shop_id: shopId,
          title: `Welcome to ${shop.name}`,
          image_url:
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1000',
          link_url: '/products',
          is_active: true,
        },
      });
    }

    return {
      message: `Demo data seeded: ${created.join(', ')}`,
      productsAdded: created.length,
    };
  }

  // Delete/Clear demo data for a shop (Super Admin)
  async deleteDemoData(shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const categories = await this.prisma.category.findMany({
      where: {
        shop_id: shopId,
        slug: { in: ['demo-products', 'cleansers'] },
      },
      select: { id: true },
    });
    const categoryIds = categories.map((c) => c.id);

    const productsToDelete = await this.prisma.product.findMany({
      where: {
        shop_id: shopId,
        OR: [
          { category_id: { in: categoryIds } },
          { slug: { startsWith: 'rose-toner-' } },
          { slug: { startsWith: 'kumkumadi-oil-' } },
          { slug: { startsWith: 'neem-facewash-' } },
          { slug: 'demo-cleanser' },
        ],
      },
      select: { id: true },
    });
    const productIds = productsToDelete.map((p) => p.id);

    await this.prisma.$transaction(async (tx) => {
      if (productIds.length > 0) {
        await tx.product.deleteMany({
          where: { id: { in: productIds } },
        });
      }

      if (categoryIds.length > 0) {
        await tx.category.deleteMany({
          where: { id: { in: categoryIds } },
        });
      }

      await tx.banner.deleteMany({
        where: {
          shop_id: shopId,
          image_url: {
            in: [
              'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1000',
              'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=1000',
            ],
          },
        },
      });
    });

    return {
      message: 'Demo data deleted successfully',
      productsDeleted: productIds.length,
    };
  }

  // Get dashboard stats for Super Admin overview
  async getDashboardStats() {
    const [totalShops, totalRequests, pendingRequests, totalProducts] =
      await Promise.all([
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
    },
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Pre-process items: resolve any "default-${productId}" or invalid/missing variant IDs
    const resolvedItems: { variant_id: string; qty: number }[] = [];

    for (const item of dto.items) {
      let varId = item.variant_id;
      if (!varId) {
        throw new BadRequestException('item.variant_id is required');
      }

      let productId: string | null = null;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (varId.startsWith('default-')) {
        // Explicit "default-{productId}" pattern from storefront
        productId = varId.replace('default-', '');
      } else if (uuidRegex.test(varId)) {
        // Valid UUID — check if it's a known variant in this shop
        const isVariant = await this.prisma.productVariant.count({
          where: { id: varId, shop_id: shopId },
        });
        if (isVariant === 0) {
          // Not a variant — maybe it's a product ID; resolve to its default variant
          const isProduct = await this.prisma.product.count({
            where: { id: varId, shop_id: shopId },
          });
          if (isProduct > 0) {
            productId = varId;
          } else {
            throw new BadRequestException(
              `Item "${varId}" was not found in this store. Please refresh and try again.`,
            );
          }
        }
      } else {
        // Not a UUID and not a default-* pattern — invalid
        throw new BadRequestException(`Invalid variant reference: "${varId}"`);
      }

      if (productId) {
        // Find or create a default variant for this product
        let defaultVariant = await this.prisma.productVariant.findFirst({
          where: { product_id: productId, shop_id: shopId },
        });

        if (!defaultVariant) {
          const product = await this.prisma.product.findFirst({
            where: { id: productId, shop_id: shopId },
          });
          if (!product) {
            throw new BadRequestException(
              `Product with ID ${productId} not found`,
            );
          }

          // Auto-generate SKU
          const finalSku = product.master_sku?.trim()
            ? product.master_sku.trim()
            : `${productId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

          defaultVariant = await this.prisma.productVariant.create({
            data: {
              shop_id: shopId,
              product_id: productId,
              label: 'Standard',
              sku: finalSku,
              price: product.price,
              compare_price: product.compare_price,
              cost_price: product.cost_price,
              stock_qty: 100,
              is_active: true,
            },
          });
        }
        varId = defaultVariant.id;
      }

      resolvedItems.push({ variant_id: varId, qty: item.qty });
    }

    const variantIds = resolvedItems.map((item) => item.variant_id);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, shop_id: shopId },
      include: { product: true },
    });

    if (variants.length !== resolvedItems.length) {
      const foundIds = new Set(variants.map((v) => v.id));
      const missing = variantIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Product variants not found: ${missing.join(', ')}. Please refresh and try again.`,
      );
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Check stock levels
    for (const item of resolvedItems) {
      const variant = variantMap.get(item.variant_id);
      if (!variant) continue;
      if (variant.stock_qty < item.qty) {
        throw new BadRequestException(
          `Insufficient stock for ${variant.label || variant.sku}. Available: ${variant.stock_qty}`,
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of resolvedItems) {
      const variant = variantMap.get(item.variant_id);
      if (variant) {
        subtotal += Number(variant.price) * item.qty;
      }
    }

    const shippingFee = subtotal >= 500 ? 0 : 50;
    const total = subtotal + shippingFee;

    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Link customer if they have an account (non-critical — guest orders always allowed)
    let customer: any = null;
    try {
      customer = await this.tenantPrisma.customer.findFirst({
        where: { shop_id: shopId, email: dto.customer_email },
      });
    } catch {
      // tenantPrisma unavailable or customer table missing — proceed as guest order
      customer = null;
    }

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
          shipping_address: {
            ...(dto.shipping_address || {}),
            email: dto.customer_email || dto.shipping_address?.email || null,
            phone: dto.customer_phone || dto.shipping_address?.phone || null,
            full_name: dto.customer_name || dto.shipping_address?.full_name || null
          },
          notes: dto.notes || null,
          items: {
            create: resolvedItems.map((item) => {
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
                },
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Log initial order status
      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId,
          order_id: order.id,
          from_status: null,
          to_status: 'pending',
          note: `Order submitted via storefront (${dto.payment_method.toUpperCase()})`,
        },
      });

      // 3. For Cash on Delivery (COD), deduct stock immediately & confirm order
      if (dto.payment_method === 'cod') {
        const confirmedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' },
        });

        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId,
            order_id: order.id,
            from_status: 'pending',
            to_status: 'confirmed',
            note: 'Order confirmed under Cash on Delivery (COD) terms',
          },
        });

        // Deduct inventory stock
        for (const item of resolvedItems) {
          const variant = variantMap.get(item.variant_id);
          if (variant) {
            const newQty = Math.max(0, variant.stock_qty - item.qty);
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: { stock_qty: newQty },
            });

            // Log warehouse transaction if active warehouse exists
            const warehouse = await tx.warehouse.findFirst({
              where: { shop_id: shopId, is_active: true },
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
                  note: `COD Order sale deduction: ${orderNumber}`,
                },
              });
            }
          }
        }

        return {
          order: confirmedOrder,
          paymentRequired: false,
          gatewayOrder: null,
        };
      }

      // 4. For online payment (e.g. Razorpay), initialize dynamic transaction parameters
      let gatewayOrder: any = null;
      if (dto.payment_method === 'razorpay') {
        gatewayOrder = await this.paymentService.createRazorpayOrder(
          shopId,
          total,
          'INR',
          order.order_number,
        );
      }

      return { order, paymentRequired: true, gatewayOrder };
    });
  }

  // Get public order by ID scoped to this shop (for payment page)
  async getPublicOrderById(shopId: string, orderId: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId,
      );
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

    // Try to fetch customer details from tenant DB (non-critical)
    let customerInfo: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    } | null = null;
    if (order.customer_id) {
      try {
        customerInfo = (await this.tenantPrisma.customer.findUnique({
          where: { id: order.customer_id },
          select: { id: true, name: true, email: true, phone: true },
        })) as any;
      } catch {
        customerInfo = null;
      }
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
      customer: customerInfo,
      items: (order.items || []).map((item) => ({
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
    const isLocal =
      platformDomain === 'localhost' || platformDomain.includes('localhost');
    const storeSuffix = isLocal ? 'localhost' : platformDomain;

    return domains.map((d) => {
      if (d.type === 'subdomain') {
        return {
          ...d,
          domain: `${slug}.${storeSuffix}`,
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
      }),
    );
    await Promise.all(promises);
    return { success: true, saved: Object.keys(data).length };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACT FORM — saves as notification for admin
  // ─────────────────────────────────────────────────────────────────────────────

  async submitContactForm(
    shopId: string,
    dto: {
      name: string;
      email: string;
      subject?: string;
      message: string;
    },
  ) {
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
    return {
      success: true,
      message: 'Thank you! Your message has been received.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLATFORM ADMIN / SUPER ADMIN AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────────────────

  async adminLogin(dto: { email: string; password: string }) {
    const defaultEmail = process.env.ADMIN_EMAIL || 'admin@oaksol.in';
    const defaultPassword = process.env.ADMIN_PASSWORD || '1234';

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
            'MANAGE_TEAM',
          ],
          status: 'active',
        },
      });
      console.log(
        `[Auto-Bootstrap] Provisioned default Master Admin: ${defaultEmail}`,
      );
    }

    // 2. Query the admin from the database
    let admin = await this.prisma.platformAdmin.findFirst({
      where: {
        email: {
          equals: dto.email,
          mode: 'insensitive',
        },
      },
    });

    if (!admin || admin.status !== 'active') {
      throw new BadRequestException(
        'Invalid admin credentials or inactive account.',
      );
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
        'MANAGE_TEAM',
      ];
      if (!admin.permissions || admin.permissions.length === 0) {
        admin = await this.prisma.platformAdmin.update({
          where: { id: admin.id },
          data: { permissions: allPermissions },
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
    const secret =
      process.env.JWT_SECRET ||
      'oaksol-commerce-jwt-secret-key-replace-in-production';
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'super_admin',
        permissions: admin.permissions || [],
      },
      secret,
      { expiresIn: '7d' },
    );

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions || [],
      },
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
        created_at: true,
      },
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
        created_at: true,
      },
    });
  }

  async createPlatformAdmin(dto: {
    name: string;
    email: string;
    password?: string;
    permissions?: string[];
  }) {
    const existing = await this.prisma.platformAdmin.findFirst({
      where: {
        email: {
          equals: dto.email,
          mode: 'insensitive',
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Administrator with this email already exists.',
      );
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
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true,
      },
    });
  }

  async updatePlatformAdmin(
    id: string,
    dto: { status?: string; permissions?: string[] },
  ) {
    const targetAdmin = await this.prisma.platformAdmin.findUnique({
      where: { id },
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
        created_at: true,
      },
    });
  }

  async deletePlatformAdmin(id: string) {
    const targetAdmin = await this.prisma.platformAdmin.findUnique({
      where: { id },
    });
    if (!targetAdmin) {
      throw new NotFoundException('Administrator not found.');
    }

    if (targetAdmin.email === 'admin@oaksol.in') {
      throw new BadRequestException('Cannot delete the primary owner.');
    }

    await this.prisma.platformAdmin.delete({
      where: { id },
    });

    return { success: true };
  }

  // Merchant / Store Owner Login (Shopify Style - resolves shop by email lookup)
  async merchantLogin(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: dto.email.trim(),
          mode: 'insensitive',
        },
      },
      include: { shop: true },
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
      isMatch = await bcrypt
        .compare(dto.password, user.password_hash)
        .catch(() => false);
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
        slug: user.shop.slug,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Update shop settings from merchant console
  async updateShopSettings(
    shopId: string,
    dto: {
      name?: string;
      description?: string;
      logo_url?: string;
      currency?: string;
      timezone?: string;
    },
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logo_url !== undefined && { logo_url: dto.logo_url }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.timezone && { timezone: dto.timezone }),
      },
    });
  }

  // Switch shop industry theme from merchant console
  async switchShopTheme(shopId: string, industry: string, theme: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');

    const industryKey = industry.toLowerCase();
    const themeKey = theme.toLowerCase();

    const selectedIndustry = TEMPLATES[industryKey] || TEMPLATES.fashion;
    const selectedTemplate = selectedIndustry[themeKey] || Object.values(selectedIndustry)[0];

    const themeColors = {
      primaryColor: selectedTemplate.theme.primaryColor,
      secondaryColor: selectedTemplate.theme.secondaryColor,
      backgroundColor: selectedTemplate.theme.backgroundColor,
      fontFamily: selectedTemplate.theme.fontFamily || 'Inter, sans-serif'
    };

    // 1. Update theme settings keys
    await this.prisma.setting.upsert({
      where: { shop_id_key: { shop_id: shopId, key: 'theme_industry' } },
      create: { shop_id: shopId, key: 'theme_industry', value: industryKey, group: 'general' },
      update: { value: industryKey },
    });

    await this.prisma.setting.upsert({
      where: { shop_id_key: { shop_id: shopId, key: 'theme_style' } },
      create: { shop_id: shopId, key: 'theme_style', value: themeKey, group: 'general' },
      update: { value: themeKey },
    });

    // Update specific settings keys from templates (announcement_bar, about page content, etc.)
    const templateSettings = {
      announcement_bar: selectedTemplate.settings.announcement_bar || 'Welcome to our store!',
      announcement_bar_active: selectedTemplate.settings.announcement_bar_active || 'true',
      about_title: selectedTemplate.settings.about_title || 'About Our Brand',
      about_tagline: selectedTemplate.settings.about_tagline || 'Crafted with passion',
      about_content: selectedTemplate.settings.about_content || `Welcome to our store. We provide high-quality items for all our customers.`,
    };

    for (const [key, value] of Object.entries(templateSettings)) {
      await this.prisma.setting.upsert({
        where: { shop_id_key: { shop_id: shopId, key } },
        create: { shop_id: shopId, key, value, group: 'pages' },
        update: { value },
      });
    }

    // 2. Update theme styles for all existing pages
    await this.prisma.page.updateMany({
      where: { shop_id: shopId },
      data: {
        theme: themeColors,
      },
    });

    // 3. Clear and re-seed Home Page widgets
    const homePage = await this.prisma.page.findFirst({
      where: { shop_id: shopId, slug: 'index' },
    });

    if (homePage) {
      await this.prisma.widget.deleteMany({
        where: { page_id: homePage.id },
      });

      if (selectedTemplate.homepage && selectedTemplate.homepage.length > 0) {
        await this.prisma.widget.createMany({
          data: selectedTemplate.homepage.map((w, index) => ({
            page_id: homePage.id,
            type: w.type,
            sort_order: index + 1,
            content: w.content || {},
            styles: w.styles || {},
          })),
        });
      }
    }

    return {
      success: true,
      industry: industryKey,
      theme: themeKey,
      themeColors,
    };
  }

  // Get store statistics
  async getShopStats(shopId: string) {
    const [products, categories, orders, customers, domains, users] = await Promise.all([
      this.prisma.product.count({ where: { shop_id: shopId } }),
      this.prisma.category.count({ where: { shop_id: shopId } }),
      this.prisma.order.count({ where: { shop_id: shopId } }),
      this.tenantPrisma.customer.count({ where: { shop_id: shopId } }),
      this.prisma.shopDomain.count({ where: { shop_id: shopId } }),
      this.prisma.user.count({ where: { shop_id: shopId } }),
    ]);

    return { products, categories, orders, customers, domains, users };
  }

  // Get shop users / staff
  async getShopUsers(shopId: string) {
    return this.prisma.user.findMany({
      where: { shop_id: shopId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  // Add shop user / staff
  async addShopUser(
    shopId: string,
    dto: { name: string; email: string; password?: string; role?: string },
  ) {
    const emailLower = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      throw new BadRequestException('A user with this email address already exists.');
    }

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(dto.password || 'password123', 10);

    return this.prisma.user.create({
      data: {
        shop_id: shopId,
        name: dto.name.trim(),
        email: emailLower,
        password_hash: hash,
        role: dto.role || 'staff',
      },
    });
  }

  // Delete shop user / staff
  async deleteShopUser(shopId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, shop_id: shopId },
    });
    if (!user) {
      throw new NotFoundException('User not found in this shop context.');
    }
    return this.prisma.user.delete({ where: { id: userId } });
  }

  // Get domains mapped to the shop
  async getShopDomains(shopId: string) {
    return this.prisma.shopDomain.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'asc' },
    });
  }

  // Add custom domain / subdomain
  async addShopDomain(shopId: string, dto: { domain: string; type?: string }) {
    const domainLower = dto.domain.trim().toLowerCase();
    const existing = await this.prisma.shopDomain.findUnique({
      where: { domain: domainLower },
    });
    if (existing) {
      throw new BadRequestException('This domain mapping is already in use by another shop.');
    }

    return this.prisma.shopDomain.create({
      data: {
        shop_id: shopId,
        domain: domainLower,
        type: dto.type || 'custom',
        is_primary: false,
        status: 'active',
        verified_at: new Date(),
      },
    });
  }

  // Set domain as primary
  async setPrimaryDomain(shopId: string, domainId: string) {
    const domain = await this.prisma.shopDomain.findFirst({
      where: { id: domainId, shop_id: shopId },
    });
    if (!domain) {
      throw new NotFoundException('Domain mapping not found.');
    }

    await this.prisma.shopDomain.updateMany({
      where: { shop_id: shopId },
      data: { is_primary: false },
    });

    return this.prisma.shopDomain.update({
      where: { id: domainId },
      data: { is_primary: true },
    });
  }

  // Delete domain mapping
  async deleteShopDomain(shopId: string, domainId: string) {
    const domain = await this.prisma.shopDomain.findFirst({
      where: { id: domainId, shop_id: shopId },
    });
    if (!domain) {
      throw new NotFoundException('Domain mapping not found.');
    }
    if (domain.is_primary) {
      throw new BadRequestException('Cannot delete a primary domain. Set another domain as primary first.');
    }
    return this.prisma.shopDomain.delete({ where: { id: domainId } });
  }

  // Get configurations overrides
  async getConfigOverrides(shopId: string) {
    const systemSettings = await this.prisma.systemSetting.findMany({
      where: { is_public: true },
    });
    const shopSettings = await this.prisma.setting.findMany({
      where: { shop_id: shopId },
    });

    const shopSettingsMap = new Map(shopSettings.map((s) => [s.key, s.value]));

    const resolved = systemSettings.map((sys) => {
      const hasOverride = shopSettingsMap.has(sys.key);
      const activeValue = hasOverride ? shopSettingsMap.get(sys.key)! : sys.value;
      return {
        key: sys.key,
        description: sys.description,
        systemDefault: sys.value,
        activeValue,
        origin: hasOverride ? 'shop_override' : 'global',
      };
    });

    // Also include other shop-specific settings not in SystemSettings (e.g. groups different than 'pages')
    const systemKeys = new Set(systemSettings.map((sys) => sys.key));
    const extraSettings = shopSettings
      .filter((s) => !systemKeys.has(s.key) && s.group !== 'pages')
      .map((s) => ({
        key: s.key,
        description: 'Shop-specific configuration parameter',
        systemDefault: 'N/A',
        activeValue: s.value,
        origin: 'shop_override',
      }));

    return [...resolved, ...extraSettings];
  }

  // Save/Override config key
  async saveConfigOverride(shopId: string, dto: { key: string; value: string }) {
    if (!dto.key.trim()) {
      throw new BadRequestException('Configuration key is required.');
    }
    return this.prisma.setting.upsert({
      where: { shop_id_key: { shop_id: shopId, key: dto.key.trim() } },
      create: {
        shop_id: shopId,
        key: dto.key.trim(),
        value: dto.value,
        group: 'custom',
      },
      update: { value: dto.value },
    });
  }

  // Reset override back to global system default
  async deleteConfigOverride(shopId: string, key: string) {
    try {
      return await this.prisma.setting.delete({
        where: { shop_id_key: { shop_id: shopId, key } },
      });
    } catch (err) {
      throw new NotFoundException(`No shop-specific override found for key: ${key}`);
    }
  }

  // JSON Database backup
  async getJsonBackup(shopId: string) {
    const [shop, products, categories, orders, customers, settings, domains] = await Promise.all([
      this.prisma.shop.findUnique({ where: { id: shopId } }),
      this.prisma.product.findMany({ where: { shop_id: shopId }, include: { variants: true, gallery: true } }),
      this.prisma.category.findMany({ where: { shop_id: shopId } }),
      this.prisma.order.findMany({ where: { shop_id: shopId }, include: { items: true } }),
      this.tenantPrisma.customer.findMany({ where: { shop_id: shopId } }),
      this.prisma.setting.findMany({ where: { shop_id: shopId } }),
      this.prisma.shopDomain.findMany({ where: { shop_id: shopId } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      shopId,
      shopName: shop?.name || 'Unknown',
      data: {
        shop,
        products,
        categories,
        orders,
        customers,
        settings,
        domains,
      },
    };
  }

  // SQL Database backup
  async getSqlBackup() {
    const fs = await import('fs');
    const path = await import('path');

    // Try a few fallback locations to find the db_export.sql file
    const possiblePaths = [
      path.join(process.cwd(), '../db_export.sql'),
      path.join(process.cwd(), 'db_export.sql'),
      path.join(__dirname, '../../../../db_export.sql'),
      path.join(__dirname, '../../../db_export.sql'),
      path.join(__dirname, '../../db_export.sql'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    }

    // Dynamic generation fallback: serialize central database tables to basic SQL insertions if file is missing
    const shops = await this.prisma.shop.findMany();
    const domains = await this.prisma.shopDomain.findMany();
    
    let sql = `-- Backup generated dynamically on ${new Date().toISOString()}\n`;
    sql += `-- Standard fallback tables dumps:\n\n`;
    
    sql += `CREATE TABLE IF NOT EXISTS shops (id UUID PRIMARY KEY, name VARCHAR(150), slug VARCHAR(100) UNIQUE, plan VARCHAR(50), status VARCHAR(30), logo_url TEXT, description TEXT, currency CHAR(3), timezone VARCHAR(60));\n`;
    for (const s of shops) {
      sql += `INSERT INTO shops (id, name, slug, plan, status, logo_url, description, currency, timezone) VALUES ('${s.id}', '${s.name.replace(/'/g, "''")}', '${s.slug}', '${s.plan}', '${s.status}', ${s.logo_url ? `'${s.logo_url}'` : 'NULL'}, ${s.description ? `'${s.description.replace(/'/g, "''")}'` : 'NULL'}, '${s.currency}', '${s.timezone}') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, status=EXCLUDED.status;\n`;
    }

    sql += `\nCREATE TABLE IF NOT EXISTS shop_domains (id UUID PRIMARY KEY, shop_id UUID, domain VARCHAR(255) UNIQUE, type VARCHAR(20), is_primary BOOLEAN, status VARCHAR(30));\n`;
    for (const d of domains) {
      sql += `INSERT INTO shop_domains (id, shop_id, domain, type, is_primary, status) VALUES ('${d.id}', '${d.shop_id}', '${d.domain}', '${d.type}', ${d.is_primary}, '${d.status}') ON CONFLICT (domain) DO UPDATE SET is_primary=EXCLUDED.is_primary, status=EXCLUDED.status;\n`;
    }
    
    return sql;
  }

  // Update advanced shop settings
  async updateAdvancedSettings(
    shopId: string,
    dto: { slug?: string; status?: string; db_connection_url?: string },
  ) {
    if (dto.slug) {
      const slugLower = dto.slug.trim().toLowerCase();
      const existing = await this.prisma.shop.findUnique({
        where: { slug: slugLower },
      });
      if (existing && existing.id !== shopId) {
        throw new BadRequestException('This store subdomain/slug is already taken.');
      }
    }

    return this.prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(dto.slug && { slug: dto.slug.trim().toLowerCase() }),
        ...(dto.status && { status: dto.status }),
        ...(dto.db_connection_url !== undefined && {
          db_connection_url: dto.db_connection_url ? dto.db_connection_url.trim() : null,
        }),
      },
    });
  }
}
