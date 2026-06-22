import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class StorefrontService {
  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
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

  // Get public platform-wide settings
  async getPublicSystemSettings() {
    return this.prisma.systemSetting.findMany({
      where: { is_public: true },
      select: { key: true, value: true, description: true },
    });
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
}
