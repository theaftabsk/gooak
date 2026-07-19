import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { TEMPLATES } from './templates';

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  async getSubscription(shopId: string) {
    return this.prisma.shopSubscription.findUnique({
      where: { shop_id: shopId },
      include: {
        plan: { include: { plan_addons: { include: { addon: true } } } },
        promo_code: { select: { code: true, discount_type: true, discount_value: true } },
        addons: { include: { addon: true } },
        payments: { orderBy: { created_at: 'desc' }, take: 5 },
      },
    });
  }

  private async generateUniqueSku(shopId: string, baseName: string, userSku?: string): Promise<string> {
    if (userSku?.trim()) {
      const candidate = userSku.trim();
      const existing = await this.prisma.productVariant.count({
        where: { sku: candidate },
      });
      if (existing === 0) {
        return candidate;
      }
      return `${candidate}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const clean = baseName
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const prefix = clean.substring(0, 8) || 'SKU';

    let candidate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    let count = 0;
    while (true) {
      const existing = await this.prisma.productVariant.count({
        where: { sku: candidate },
      });
      if (existing === 0) {
        return candidate;
      }
      count++;
      candidate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${count}`;
    }
  }

  async createProduct(shopId: string, dto: CreateProductDto) {
    const {
      custom_sections,
      gallery,
      media,
      faqs,
      variants,
      specifications,
      collections,
      product_tags,
      sort_order,
      ...rest
    } = dto;
    const userSku = dto.master_sku?.trim();

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the product
      const product = await tx.product.create({
        data: {
          ...rest,
          shop_id: shopId,
          custom_sections: custom_sections || [],
          product_tags: product_tags || [],
        },
      });

      const finalSku = await this.generateUniqueSku(shopId, product.name, userSku);

      // Save the finalized SKU to the product record
      await tx.product.update({
        where: { id: product.id },
        data: { master_sku: finalSku },
      });

      // 2. Sync gallery if provided
      if (gallery && Array.isArray(gallery) && gallery.length > 0) {
        await tx.productGallery.createMany({
          data: gallery.map((g: any, index: number) => ({
            shop_id: shopId,
            product_id: product.id,
            url: g.url,
            alt_text: g.alt_text || null,
            sort_order: g.sort_order !== undefined ? g.sort_order : index,
            is_cover: !!g.is_cover,
          })),
        });
      }

      // 3. Sync media if provided
      if (media && Array.isArray(media) && media.length > 0) {
        await tx.productMedia.createMany({
          data: media.map((m: any, index: number) => ({
            shop_id: shopId,
            product_id: product.id,
            type: m.type || 'image',
            url: m.url,
            alt_text: m.alt_text || null,
            sort_order: m.sort_order !== undefined ? m.sort_order : index,
            is_cover: !!m.is_cover,
          })),
        });
      }

      // 4. Sync FAQs if provided
      if (faqs && Array.isArray(faqs) && faqs.length > 0) {
        await tx.productFaq.createMany({
          data: faqs.map((f: any, index: number) => ({
            shop_id: shopId,
            product_id: product.id,
            question: f.question,
            answer: f.answer,
            sort_order: f.sort_order !== undefined ? f.sort_order : index,
          })),
        });
      }

      // 5. Sync specifications if provided
      if (specifications && Array.isArray(specifications) && specifications.length > 0) {
        await tx.productSpecification.createMany({
          data: specifications.map((s: any, index: number) => ({
            shop_id: shopId,
            product_id: product.id,
            name: s.name,
            value: s.value,
            sort_order: s.sort_order !== undefined ? s.sort_order : index,
          })),
        });
      }

      // 6. Sync collections if provided
      if (collections && Array.isArray(collections) && collections.length > 0) {
        await tx.collectionProduct.createMany({
          data: collections.map((colId: string) => ({
            collection_id: colId,
            product_id: product.id,
          })),
        });
      }

      // 7. Sync product_tags in DB
      if (product_tags && Array.isArray(product_tags) && product_tags.length > 0) {
        for (const tagName of product_tags) {
          if (!tagName.trim()) continue;
          const tag = await tx.tag.upsert({
            where: { shop_id_name: { shop_id: shopId, name: tagName.trim() } },
            create: { shop_id: shopId, name: tagName.trim() },
            update: {},
          });
          await tx.productTag.create({
            data: { product_id: product.id, tag_id: tag.id },
          });
        }
      }

      // 8. Create default variant or custom variants
      if (variants && Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          const varSku = await this.generateUniqueSku(shopId, product.name, v.sku);
          const variant = await tx.productVariant.create({
            data: {
              shop_id: shopId,
              product_id: product.id,
              sku: varSku,
              label: v.label || 'Default',
              price: v.price !== undefined ? parseFloat(v.price) : product.price,
              compare_price: v.compare_price !== undefined ? parseFloat(v.compare_price) : product.compare_price,
              cost_price: v.cost_price !== undefined ? parseFloat(v.cost_price) : product.cost_price,
              stock_qty: v.stock_qty !== undefined ? parseInt(v.stock_qty) : 100,
              track_inventory: v.track_inventory !== undefined ? !!v.track_inventory : true,
              low_stock_at: v.low_stock_at !== undefined ? parseInt(v.low_stock_at) : 5,
              barcode: v.barcode || null,
              weight: v.weight !== undefined ? parseFloat(v.weight) : null,
              length: v.length !== undefined ? parseFloat(v.length) : null,
              width: v.width !== undefined ? parseFloat(v.width) : null,
              height: v.height !== undefined ? parseFloat(v.height) : null,
              image_url: v.image_url || null,
              is_active: v.is_active !== undefined ? !!v.is_active : true,
            },
          });

          if (v.attributes && Array.isArray(v.attributes)) {
            await tx.variantAttribute.createMany({
              data: v.attributes.map((attr: any, idx: number) => ({
                shop_id: shopId,
                variant_id: variant.id,
                attr_key: attr.attr_key || attr.name || '',
                attr_value: attr.attr_value || attr.value || '',
                sort_order: attr.sort_order !== undefined ? attr.sort_order : idx,
              })),
            });
          }
        }
      } else {
        await tx.productVariant.create({
          data: {
            shop_id: shopId,
            product_id: product.id,
            sku: finalSku,
            label: 'Default',
            price: product.price,
            compare_price: product.compare_price,
            cost_price: product.cost_price,
            stock_qty: 100,
            is_active: true,
          },
        });
      }

      // Return the complete product
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          gallery: { orderBy: { sort_order: 'asc' } },
          media: { orderBy: { sort_order: 'asc' } },
          variants: {
            include: { attributes: { orderBy: { sort_order: 'asc' } } },
            orderBy: { sort_order: 'asc' },
          },
          faqs: { orderBy: { sort_order: 'asc' } },
          category: true,
          brand: true,
          specifications: { orderBy: { sort_order: 'asc' } },
          tags: { include: { tag: true } },
          collections: { include: { collection: true } },
        },
      });
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
        media: { orderBy: { sort_order: 'asc' } },
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
        specifications: { orderBy: { sort_order: 'asc' } },
        tags: { include: { tag: true } },
        collections: { include: { collection: true } },
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
      media,
      faqs,
      category,
      brand,
      tax,
      variants,
      reviews,
      specifications,
      collections,
      product_tags,
      id,
      shop_id,
      created_at,
      updated_at,
      sort_order,
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
          product_tags:
            product_tags !== undefined && Array.isArray(product_tags) ? product_tags : undefined,
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

      // 3. Sync media if provided
      if (media !== undefined && Array.isArray(media)) {
        await tx.productMedia.deleteMany({
          where: { product_id: productId, shop_id: shopId },
        });
        if (media.length > 0) {
          await tx.productMedia.createMany({
            data: media.map((m: any, index: number) => ({
              shop_id: shopId,
              product_id: productId,
              type: m.type || 'image',
              url: m.url,
              alt_text: m.alt_text || null,
              sort_order: m.sort_order !== undefined ? m.sort_order : index,
              is_cover: !!m.is_cover,
            })),
          });
        }
      }

      // 4. Sync FAQs if provided
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

      // 5. Sync specifications if provided
      if (specifications !== undefined && Array.isArray(specifications)) {
        await tx.productSpecification.deleteMany({
          where: { product_id: productId, shop_id: shopId },
        });
        if (specifications.length > 0) {
          await tx.productSpecification.createMany({
            data: specifications.map((s: any, index: number) => ({
              shop_id: shopId,
              product_id: productId,
              name: s.name,
              value: s.value,
              sort_order: s.sort_order !== undefined ? s.sort_order : index,
            })),
          });
        }
      }

      // 6. Sync collections if provided
      if (collections !== undefined && Array.isArray(collections)) {
        await tx.collectionProduct.deleteMany({
          where: { product_id: productId },
        });
        if (collections.length > 0) {
          await tx.collectionProduct.createMany({
            data: collections.map((colId: string) => ({
              collection_id: colId,
              product_id: productId,
            })),
          });
        }
      }

      // 7. Sync product_tags in DB
      if (product_tags !== undefined && Array.isArray(product_tags)) {
        await tx.productTag.deleteMany({
          where: { product_id: productId },
        });
        for (const tagName of product_tags) {
          if (!tagName.trim()) continue;
          const tag = await tx.tag.upsert({
            where: { shop_id_name: { shop_id: shopId, name: tagName.trim() } },
            create: { shop_id: shopId, name: tagName.trim() },
            update: {},
          });
          await tx.productTag.create({
            data: { product_id: productId, tag_id: tag.id },
          });
        }
      }
    });

    // Return full product with all relations after save
    return this.prisma.product.findFirst({
      where: { id: productId, shop_id: shopId },
      include: {
        gallery: { orderBy: { sort_order: 'asc' } },
        media: { orderBy: { sort_order: 'asc' } },
        variants: {
          include: { attributes: { orderBy: { sort_order: 'asc' } } },
          orderBy: { sort_order: 'asc' },
        },
        faqs: { orderBy: { sort_order: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        specifications: { orderBy: { sort_order: 'asc' } },
        tags: { include: { tag: true } },
        collections: { include: { collection: true } },
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
        status_logs: { orderBy: { created_at: 'asc' } },
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateOrderStatus(
    shopId: string,
    orderId: string,
    status: string,
    note?: string,
    extra?: {
      courier_name?: string;
      tracking_number?: string;
      tracking_url?: string;
      dispatched_at?: string;
      expected_delivery_at?: string;
      fulfillment_status?: string;
      staff_notes?: string;
      return_status?: string;
      paid_amount?: number;
      payment_method?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, shop_id: shopId },
    });
    if (!order) {
      throw new Error('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status };

      if (extra) {
        if (extra.courier_name !== undefined) updateData.courier_name = extra.courier_name || null;
        if (extra.tracking_number !== undefined) updateData.tracking_number = extra.tracking_number || null;
        if (extra.tracking_url !== undefined) updateData.tracking_url = extra.tracking_url || null;
        if (extra.dispatched_at !== undefined) updateData.dispatched_at = extra.dispatched_at ? new Date(extra.dispatched_at) : null;
        if (extra.expected_delivery_at !== undefined) updateData.expected_delivery_at = extra.expected_delivery_at ? new Date(extra.expected_delivery_at) : null;
        if (extra.fulfillment_status !== undefined) updateData.fulfillment_status = extra.fulfillment_status;
        if (extra.staff_notes !== undefined) updateData.staff_notes = extra.staff_notes || null;
        if (extra.return_status !== undefined) updateData.return_status = extra.return_status || null;
        if (extra.paid_amount !== undefined) {
          if (extra.paid_amount === null || String(extra.paid_amount).trim() === '') {
            updateData.paid_amount = null;
          } else {
            const val = parseFloat(String(extra.paid_amount));
            updateData.paid_amount = isNaN(val) ? null : val;
          }
        }
        if (extra.payment_method !== undefined) updateData.payment_method = extra.payment_method || null;
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      // Automatically generate invoice when order is paid / processing / delivered
      if (status === 'processing' || status === 'delivered') {
        await this.createInvoiceFromOrder(shopId, orderId, tx);
      }

      // Only create status log if status actually changed
      if (status !== order.status) {
        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId,
            order_id: orderId,
            from_status: order.status,
            to_status: status,
            note: note || `Order status updated to ${status}`,
          },
        });
      } else if (note) {
        // Log note even if status unchanged
        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId,
            order_id: orderId,
            from_status: order.status,
            to_status: status,
            note,
          },
        });
      }

      return updatedOrder;
    });
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
    const platformDomain = process.env.PLATFORM_DOMAIN || 'gooak.shop';
    const domains = await this.prisma.shopDomain.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'asc' },
    });
    return domains.map((d) => ({
      ...d,
      dns_instructions: d.type === 'custom' && d.status === 'pending'
        ? this.buildDnsInstructions(d.domain, d.dns_verification_token!, platformDomain)
        : null,
    }));
  }

  // Add a domain. Subdomains auto-verify; custom domains get a TXT token to add to DNS.
  async addShopDomain(shopId: string, dto: { domain: string }) {
    const domainLower = dto.domain.trim().toLowerCase();
    const platformDomain = process.env.PLATFORM_DOMAIN || 'gooak.shop';

    const existing = await this.prisma.shopDomain.findUnique({ where: { domain: domainLower } });
    if (existing) throw new BadRequestException('This domain is already in use by another shop.');

    const isSubdomain =
      domainLower.endsWith(`.${platformDomain}`) || domainLower.endsWith('.localhost');

    if (isSubdomain) {
      // Platform subdomain — no verification needed
      return this.prisma.shopDomain.create({
        data: {
          shop_id: shopId,
          domain: domainLower,
          type: 'subdomain',
          is_primary: false,
          status: 'active',
          verified_at: new Date(),
        },
      });
    }

    // Custom domain — generate TXT token, merchant must add it to their DNS before it goes live
    const token = `oak-verify=${this.generateVerificationToken()}`;
    const record = await this.prisma.shopDomain.create({
      data: {
        shop_id: shopId,
        domain: domainLower,
        type: 'custom',
        is_primary: false,
        status: 'pending',
        dns_verification_token: token,
      },
    });

    return {
      ...record,
      dns_instructions: this.buildDnsInstructions(domainLower, token, platformDomain),
    };
  }

  // Verify a custom domain by checking DNS TXT record
  async verifyDomain(shopId: string, domainId: string) {
    const domain = await this.prisma.shopDomain.findFirst({
      where: { id: domainId, shop_id: shopId },
    });
    if (!domain) throw new NotFoundException('Domain not found.');
    if (domain.type === 'subdomain') throw new BadRequestException('Subdomain verification is automatic.');
    if (domain.status === 'active') return { verified: true, domain };

    if (!domain.dns_verification_token) {
      throw new BadRequestException('No verification token found for this domain.');
    }

    const verified = await this.checkDnsTxtRecord(domain.domain, domain.dns_verification_token);
    if (!verified) {
      const platformDomain = process.env.PLATFORM_DOMAIN || 'gooak.shop';
      throw new BadRequestException({
        message: 'DNS TXT record not found yet. DNS propagation can take up to 48 hours.',
        dns_instructions: this.buildDnsInstructions(domain.domain, domain.dns_verification_token, platformDomain),
      });
    }

    return this.prisma.shopDomain.update({
      where: { id: domainId },
      data: { status: 'active', verified_at: new Date() },
    });
  }

  // Set domain as primary (only verified domains can be primary)
  async setPrimaryDomain(shopId: string, domainId: string) {
    const domain = await this.prisma.shopDomain.findFirst({
      where: { id: domainId, shop_id: shopId },
    });
    if (!domain) throw new NotFoundException('Domain not found.');
    if (domain.status !== 'active') {
      throw new BadRequestException('Only verified domains can be set as primary.');
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
    if (!domain) throw new NotFoundException('Domain not found.');
    if (domain.type === 'subdomain') {
      throw new BadRequestException('The platform subdomain cannot be removed.');
    }
    if (domain.is_primary) {
      throw new BadRequestException('Cannot delete the primary domain. Set another domain as primary first.');
    }
    return this.prisma.shopDomain.delete({ where: { id: domainId } });
  }

  private generateVerificationToken(): string {
    return require('crypto').randomBytes(20).toString('hex');
  }

  private buildDnsInstructions(domain: string, token: string, platformDomain: string) {
    return {
      step1: {
        description: 'Add this TXT record to your domain DNS to verify ownership:',
        record_type: 'TXT',
        host: `_oak-verify.${domain}`,
        value: token,
      },
      step2: {
        description: 'Add a CNAME record to point your domain to the platform:',
        record_type: 'CNAME',
        host: domain.startsWith('www.') ? domain : `www.${domain}`,
        value: `shops.${platformDomain}`,
      },
      step3: {
        description: 'For root domain (@), add an A record or ALIAS pointing to the platform IP.',
        note: 'Check your hosting provider — some support CNAME flattening at the root.',
      },
      note: 'DNS propagation can take up to 48 hours. Click "Verify" once the records are saved.',
    };
  }

  private async checkDnsTxtRecord(domain: string, token: string): Promise<boolean> {
    // In development, skip real DNS lookup — auto-pass so devs can test the full domain flow
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    const dns = require('dns').promises;
    try {
      const records: string[][] = await dns.resolveTxt(`_oak-verify.${domain}`);
      return records.flat().some((r) => r === token);
    } catch {
      return false;
    }
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

  // ── Collection Management ──────────────────────────────────────────────────

  async getCollections(shopId: string) {
    let collections = await this.prisma.collection.findMany({
      where: { shop_id: shopId },
      orderBy: { name: 'asc' },
    });

    if (collections.length === 0) {
      // Auto-seed default collections for a professional shopify-level catalog
      const defaults = [
        { name: 'Summer Sale', slug: 'summer-sale', description: 'Sun-kissed organic formulations' },
        { name: 'New Arrivals', slug: 'new-arrivals', description: 'Freshly harvested botanicals' },
        { name: 'Best Sellers', slug: 'best-sellers', description: 'Loved by skin care enthusiasts' },
        { name: 'Featured Products', slug: 'featured-products', description: 'Highlighted selections of the month' }
      ];

      collections = [];
      for (const d of defaults) {
        const col = await this.prisma.collection.create({
          data: {
            shop_id: shopId,
            name: d.name,
            slug: d.slug,
            description: d.description,
            is_active: true
          }
        });
        collections.push(col);
      }
    }

    return collections;
  }

  async createCollection(shopId: string, dto: { name: string; slug: string; description?: string; image_url?: string }) {
    const slug = dto.slug ? dto.slug.trim().toLowerCase() : dto.name.trim().toLowerCase().replace(/\s+/g, '-');

    // Check if slug is unique for this shop
    const existing = await this.prisma.collection.findFirst({
      where: { shop_id: shopId, slug },
    });
    if (existing) {
      throw new BadRequestException('A collection with this slug already exists for this shop.');
    }

    return this.prisma.collection.create({
      data: {
        shop_id: shopId,
        name: dto.name.trim(),
        slug,
        description: dto.description || null,
        image_url: dto.image_url || null,
        is_active: true
      }
    });
  }

  // ─── PAGES CRUD ─────────────────────────────────────────────────────────────
  async getAdminPages(shopId: string) {
    return this.prisma.page.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAdminPageById(shopId: string, id: string) {
    const page = await this.prisma.page.findFirst({
      where: { id, shop_id: shopId }
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async createAdminPage(shopId: string, dto: any) {
    const slug = dto.slug ? dto.slug.toLowerCase().trim() : dto.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.prisma.page.findFirst({
      where: { shop_id: shopId, slug }
    });
    if (existing) throw new BadRequestException('Page slug already exists');
    return this.prisma.page.create({
      data: {
        shop_id: shopId,
        title: dto.title.trim(),
        slug,
        banner_image: dto.banner_image || null,
        seo_title: dto.seo_title || null,
        seo_description: dto.seo_description || null,
        content: dto.content || null,
        status: dto.status || 'draft'
      }
    });
  }

  async updateAdminPage(shopId: string, id: string, dto: any) {
    await this.getAdminPageById(shopId, id);
    let slug = dto.slug;
    if (slug) {
      slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const existing = await this.prisma.page.findFirst({
        where: { shop_id: shopId, slug, id: { not: id } }
      });
      if (existing) throw new BadRequestException('Page slug already exists');
    }
    return this.prisma.page.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        slug,
        banner_image: dto.banner_image !== undefined ? dto.banner_image : undefined,
        seo_title: dto.seo_title !== undefined ? dto.seo_title : undefined,
        seo_description: dto.seo_description !== undefined ? dto.seo_description : undefined,
        content: dto.content !== undefined ? dto.content : undefined,
        status: dto.status !== undefined ? dto.status : undefined
      }
    });
  }

  async deleteAdminPage(shopId: string, id: string) {
    await this.getAdminPageById(shopId, id);
    return this.prisma.page.delete({ where: { id } });
  }

  // ─── BANNERS CRUD ───────────────────────────────────────────────────────────
  async getAdminBanners(shopId: string) {
    return this.prisma.banner.findMany({
      where: { shop_id: shopId },
      orderBy: { sort_order: 'asc' }
    });
  }

  async getAdminBannerById(shopId: string, id: string) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, shop_id: shopId }
    });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async createAdminBanner(shopId: string, dto: any) {
    return this.prisma.banner.create({
      data: {
        shop_id: shopId,
        type: dto.type || 'hero',
        title: dto.title || null,
        subtitle: dto.subtitle || null,
        image_url: dto.image_url || dto.image || '',
        mobile_image: dto.mobile_image || null,
        button_text: dto.button_text || null,
        button_url: dto.button_url || null,
        sort_order: dto.sort_order !== undefined ? parseInt(String(dto.sort_order)) : 0,
        is_active: dto.is_active !== undefined ? Boolean(dto.is_active) : true,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null
      }
    });
  }

  async updateAdminBanner(shopId: string, id: string, dto: any) {
    await this.getAdminBannerById(shopId, id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        subtitle: dto.subtitle,
        image_url: dto.image_url !== undefined ? dto.image_url : dto.image,
        mobile_image: dto.mobile_image,
        button_text: dto.button_text,
        button_url: dto.button_url,
        sort_order: dto.sort_order !== undefined ? parseInt(String(dto.sort_order)) : undefined,
        is_active: dto.is_active !== undefined ? Boolean(dto.is_active) : undefined,
        start_date: dto.start_date !== undefined ? (dto.start_date ? new Date(dto.start_date) : null) : undefined,
        end_date: dto.end_date !== undefined ? (dto.end_date ? new Date(dto.end_date) : null) : undefined
      }
    });
  }

  async deleteAdminBanner(shopId: string, id: string) {
    await this.getAdminBannerById(shopId, id);
    return this.prisma.banner.delete({ where: { id } });
  }

  // ─── BLOG POSTS CRUD ────────────────────────────────────────────────────────
  async getAdminBlogs(shopId: string) {
    return this.prisma.blogPost.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAdminBlogById(shopId: string, id: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { id, shop_id: shopId }
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async createAdminBlog(shopId: string, dto: any) {
    const slug = dto.slug ? dto.slug.toLowerCase().trim() : dto.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.prisma.blogPost.findFirst({
      where: { shop_id: shopId, slug }
    });
    if (existing) throw new BadRequestException('Blog post slug already exists');
    return this.prisma.blogPost.create({
      data: {
        shop_id: shopId,
        title: dto.title.trim(),
        slug,
        cover_image: dto.cover_image || null,
        content: dto.content || null,
        author: dto.author || null,
        status: dto.status || 'draft',
        published_at: dto.published_at ? new Date(dto.published_at) : null
      }
    });
  }

  async updateAdminBlog(shopId: string, id: string, dto: any) {
    await this.getAdminBlogById(shopId, id);
    let slug = dto.slug;
    if (slug) {
      slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const existing = await this.prisma.blogPost.findFirst({
        where: { shop_id: shopId, slug, id: { not: id } }
      });
      if (existing) throw new BadRequestException('Blog post slug already exists');
    }
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        slug,
        cover_image: dto.cover_image !== undefined ? dto.cover_image : undefined,
        content: dto.content !== undefined ? dto.content : undefined,
        author: dto.author !== undefined ? dto.author : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        published_at: dto.published_at !== undefined ? (dto.published_at ? new Date(dto.published_at) : null) : undefined
      }
    });
  }

  async deleteAdminBlog(shopId: string, id: string) {
    await this.getAdminBlogById(shopId, id);
    return this.prisma.blogPost.delete({ where: { id } });
  }

  // ─── MEDIA LIBRARY CRUD ─────────────────────────────────────────────────────
  async getAdminMedia(shopId: string) {
    return this.prisma.mediaLibrary.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' }
    });
  }

  async createAdminMedia(shopId: string, dto: any) {
    return this.prisma.mediaLibrary.create({
      data: {
        shop_id: shopId,
        name: dto.name || 'file',
        url: dto.url,
        type: dto.type || 'image',
        folder: dto.folder || 'root',
        size: dto.size !== undefined ? parseInt(String(dto.size)) : 0,
        alt_text: dto.alt_text || null
      }
    });
  }

  async deleteAdminMedia(shopId: string, id: string) {
    const existing = await this.prisma.mediaLibrary.findFirst({
      where: { id, shop_id: shopId }
    });
    if (!existing) throw new NotFoundException('Media item not found');
    return this.prisma.mediaLibrary.delete({ where: { id } });
  }

  // ─── FAQS CRUD ──────────────────────────────────────────────────────────────
  async getAdminFaqs(shopId: string) {
    return this.prisma.faq.findMany({
      where: { shop_id: shopId },
      orderBy: { sort_order: 'asc' }
    });
  }

  async createAdminFaq(shopId: string, dto: any) {
    return this.prisma.faq.create({
      data: {
        shop_id: shopId,
        type: dto.type || 'general',
        question: dto.question.trim(),
        answer: dto.answer.trim(),
        sort_order: dto.sort_order !== undefined ? parseInt(String(dto.sort_order)) : 0
      }
    });
  }

  async updateAdminFaq(shopId: string, id: string, dto: any) {
    const faq = await this.prisma.faq.findFirst({ where: { id, shop_id: shopId } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return this.prisma.faq.update({
      where: { id },
      data: {
        type: dto.type,
        question: dto.question !== undefined ? dto.question.trim() : undefined,
        answer: dto.answer !== undefined ? dto.answer.trim() : undefined,
        sort_order: dto.sort_order !== undefined ? parseInt(String(dto.sort_order)) : undefined
      }
    });
  }

  async deleteAdminFaq(shopId: string, id: string) {
    const faq = await this.prisma.faq.findFirst({ where: { id, shop_id: shopId } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return this.prisma.faq.delete({ where: { id } });
  }

  // ─── TESTIMONIALS CRUD ──────────────────────────────────────────────────────
  async getAdminTestimonials(shopId: string) {
    return this.prisma.testimonial.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' }
    });
  }

  async createAdminTestimonial(shopId: string, dto: any) {
    return this.prisma.testimonial.create({
      data: {
        shop_id: shopId,
        customer_name: dto.customer_name.trim(),
        photo: dto.photo || null,
        rating: dto.rating !== undefined ? parseInt(String(dto.rating)) : 5,
        review: dto.review.trim(),
        status: dto.status || 'active'
      }
    });
  }

  async updateAdminTestimonial(shopId: string, id: string, dto: any) {
    const existing = await this.prisma.testimonial.findFirst({ where: { id, shop_id: shopId } });
    if (!existing) throw new NotFoundException('Testimonial not found');
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        customer_name: dto.customer_name !== undefined ? dto.customer_name.trim() : undefined,
        photo: dto.photo,
        rating: dto.rating !== undefined ? parseInt(String(dto.rating)) : undefined,
        review: dto.review !== undefined ? dto.review.trim() : undefined,
        status: dto.status
      }
    });
  }

  async deleteAdminTestimonial(shopId: string, id: string) {
    const existing = await this.prisma.testimonial.findFirst({ where: { id, shop_id: shopId } });
    if (!existing) throw new NotFoundException('Testimonial not found');
    return this.prisma.testimonial.delete({ where: { id } });
  }

  // ─── HOME SECTIONS CRUD ─────────────────────────────────────────────────────
  async getAdminHomeSections(shopId: string) {
    return this.prisma.homeSection.findMany({
      where: { shop_id: shopId },
      orderBy: { sort_order: 'asc' }
    });
  }

  async updateAdminHomeSection(shopId: string, dto: { section_key: string; enabled: boolean; sort_order: number; settings_json: any }) {
    return this.prisma.homeSection.upsert({
      where: {
        shop_id_section_key: {
          shop_id: shopId,
          section_key: dto.section_key
        }
      },
      update: {
        enabled: dto.enabled,
        sort_order: dto.sort_order,
        settings_json: dto.settings_json || {}
      },
      create: {
        shop_id: shopId,
        section_key: dto.section_key,
        enabled: dto.enabled,
        sort_order: dto.sort_order,
        settings_json: dto.settings_json || {}
      }
    });
  }

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

  // ─── RETURNS SYSTEM CRUD ────────────────────────────────────────────────────
  async getReturns(shopId: string) {
    return this.prisma.orderReturn.findMany({
      where: { shop_id: shopId },
      include: {
        order: {
          select: {
            order_number: true,
            shipping_address: true,
          }
        },
        items: {
          include: {
            variant: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getReturnById(shopId: string, id: string) {
    const orderReturn = await this.prisma.orderReturn.findFirst({
      where: { id, shop_id: shopId },
      include: {
        order: {
          select: {
            order_number: true,
            shipping_address: true,
          }
        },
        items: {
          include: {
            variant: true
          }
        },
        logs: {
          orderBy: { created_at: 'asc' }
        }
      }
    });
    if (!orderReturn) throw new NotFoundException('Return request not found');
    return orderReturn;
  }

  async createReturn(shopId: string, dto: {
    order_id: string;
    reason: string;
    images?: string[];
    customer_note?: string;
    items: Array<{ variant_id: string; qty: number; price: number }>;
  }) {
    // 1. Create Return Order
    const orderReturn = await this.prisma.orderReturn.create({
      data: {
        shop_id: shopId,
        order_id: dto.order_id,
        reason: dto.reason,
        images: dto.images || [],
        customer_note: dto.customer_note || null,
        status: 'requested',
        items: {
          create: dto.items.map(item => ({
            shop_id: shopId,
            variant_id: item.variant_id,
            qty: item.qty,
            price: item.price
          }))
        },
        logs: {
          create: {
            shop_id: shopId,
            status: 'requested',
            note: 'Return request submitted by customer',
            changed_by: 'customer'
          }
        }
      }
    });

    // 2. Update order return_status
    await this.prisma.order.update({
      where: { id: dto.order_id },
      data: { return_status: 'requested' }
    });

    return orderReturn;
  }

  async updateReturnStatus(shopId: string, id: string, dto: {
    status: string;
    staff_note?: string;
    refund_amount?: number;
    refund_method?: string;
  }) {
    const existing = await this.getReturnById(shopId, id);

    const updateData: any = {
      status: dto.status,
      staff_note: dto.staff_note !== undefined ? dto.staff_note : undefined,
    };

    if (dto.status === 'refunded') {
      updateData.refund_amount = dto.refund_amount !== undefined ? dto.refund_amount : undefined;
      updateData.refund_method = dto.refund_method !== undefined ? dto.refund_method : undefined;
      updateData.refund_date = new Date();
    }

    const updated = await this.prisma.orderReturn.update({
      where: { id },
      data: {
        ...updateData,
        logs: {
          create: {
            shop_id: shopId,
            status: dto.status,
            note: dto.staff_note || `Status updated to ${dto.status}`,
            changed_by: 'admin'
          }
        }
      }
    });

    // Update the main order return_status
    await this.prisma.order.update({
      where: { id: existing.order_id },
      data: { 
        return_status: dto.status,
        ...(dto.status === 'refunded' ? { status: 'refunded' } : {}) 
      }
    });

    return updated;
  }

  // ─── INVOICES SYSTEM CRUD & AUTOMATIC GENERATION ────────────────────────────
  async getInvoices(shopId: string) {
    return this.prisma.orderInvoice.findMany({
      where: { shop_id: shopId },
      include: {
        items: true,
        logs: { orderBy: { created_at: 'asc' } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getInvoiceById(shopId: string, id: string) {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id, shop_id: shopId },
      include: {
        items: true,
        logs: { orderBy: { created_at: 'asc' } }
      }
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoiceFromOrder(shopId: string, orderId: string, txClient?: any) {
    const prisma = txClient || this.prisma;

    // Check if invoice already exists
    const existing = await prisma.orderInvoice.findFirst({
      where: { shop_id: shopId, order_id: orderId },
      include: { items: true, logs: true }
    });
    if (existing) {
      return existing;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId, shop_id: shopId },
      include: { items: true }
    });
    if (!order) throw new NotFoundException('Order not found');

    // Retrieve shop settings for GSTIN, PAN, and company_name snapshots
    const settings = await prisma.setting.findMany({
      where: { shop_id: shopId }
    });
    const settingsMap = new Map(settings.map((s: any) => [s.key, s.value]));
    
    const shop = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    const companyName = String(settingsMap.get('company_name') || shop?.name || 'GoOak Merchant');
    const gstNumber = settingsMap.get('gst_number') ? String(settingsMap.get('gst_number')) : null;
    const pan = settingsMap.get('pan') ? String(settingsMap.get('pan')) : null;
    const storeState = String(settingsMap.get('store_state') || 'West Bengal').toLowerCase().trim();

    // Parse billing and shipping address states
    const shippingAddr: any = order.shipping_address || {};
    const billingAddr: any = order.billing_address || shippingAddr;
    const billingState = (billingAddr.state || billingAddr.city || '').toLowerCase().trim();

    // Determine GST division (CGST/SGST vs IGST)
    const isIntraState = billingState === '' || billingState === storeState;
    const taxAmount = Number(order.tax_amount || 0);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
      cgst = taxAmount / 2;
      sgst = taxAmount / 2;
    } else {
      igst = taxAmount;
    }

    // Resolve sequential invoice number
    const count = await prisma.orderInvoice.count({
      where: { shop_id: shopId }
    });
    const seq = String(count + 1).padStart(6, '0');
    const invoiceNumber = `INV-2026-${seq}`;

    // Create invoice, items, and log transactionally
    const invoice = await prisma.orderInvoice.create({
      data: {
        shop_id: shopId,
        order_id: orderId,
        invoice_number: invoiceNumber,
        status: order.status === 'delivered' ? 'paid' : 'issued',
        issue_date: new Date(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // due in 7 days
        paid_at: order.status === 'delivered' ? new Date() : null,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        shipping_amount: order.shipping_amount,
        tax_amount: order.tax_amount,
        total: order.total,
        cgst,
        sgst,
        igst,
        tax_breakdown: {
          cgst_rate: isIntraState ? '9%' : '0%',
          sgst_rate: isIntraState ? '9%' : '0%',
          igst_rate: isIntraState ? '0%' : '18%'
        },
        currency: shop?.currency || 'INR',
        currency_symbol: shop?.currency === 'BDT' ? '৳' : shop?.currency === 'USD' ? '$' : '₹',
        customer_name: shippingAddr.full_name || 'Customer',
        customer_email: shippingAddr.email || 'customer@gmail.com',
        billing_address: billingAddr,
        shipping_address: shippingAddr,
        merchant_company_name: companyName,
        merchant_gst_number: gstNumber,
        merchant_pan: pan,
        payment_method: order.payment_method || 'Razorpay',
        transaction_id: order.order_number, // default reference
        items: {
          create: order.items.map((item: any) => {
            const itemTaxVal = Number(item.line_total || 0) * 0.18; // default 18% calculation snapshot
            let itemCgst = 0;
            let itemSgst = 0;
            let itemIgst = 0;
            if (isIntraState) {
              itemCgst = itemTaxVal / 2;
              itemSgst = itemTaxVal / 2;
            } else {
              itemIgst = itemTaxVal;
            }

            const snap: any = item.product_snap || {};
            return {
              shop_id: shopId,
              product_name: snap.name || 'Product Item',
              sku: snap.sku || null,
              qty: item.qty,
              unit_price: item.unit_price,
              tax_rate: 18,
              cgst: itemCgst,
              sgst: itemSgst,
              igst: itemIgst,
              total: item.line_total
            };
          })
        },
        logs: {
          create: {
            shop_id: shopId,
            action: 'created',
            note: `Invoice automatically generated from order #${order.order_number}`,
            changed_by: 'system'
          }
        }
      },
      include: { items: true, logs: true }
    });

    return invoice;
  }

  async updateInvoiceStatus(shopId: string, id: string, status: string) {
    const invoice = await this.getInvoiceById(shopId, id);
    return this.prisma.orderInvoice.update({
      where: { id },
      data: {
        status,
        paid_at: status === 'paid' ? new Date() : undefined,
        logs: {
          create: {
            shop_id: shopId,
            action: status === 'paid' ? 'paid' : 'cancelled',
            note: `Invoice status updated to ${status}`,
            changed_by: 'admin'
          }
        }
      }
    });
  }

  async logInvoicePrint(shopId: string, id: string) {
    const invoice = await this.getInvoiceById(shopId, id);
    return this.prisma.orderInvoice.update({
      where: { id },
      data: {
        logs: {
          create: {
            shop_id: shopId,
            action: 'printed',
            note: `Invoice document printed/previewed`,
            changed_by: 'admin'
          }
        }
      }
    });
  }

  async emailInvoice(shopId: string, id: string) {
    const invoice = await this.getInvoiceById(shopId, id);
    return this.prisma.orderInvoice.update({
      where: { id },
      data: {
        logs: {
          create: {
            shop_id: shopId,
            action: 'emailed',
            note: `Simulated email transmission of PDF copy to ${invoice.customer_email}`,
            changed_by: 'admin'
          }
        }
      }
    });
  }
}
