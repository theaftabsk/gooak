import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { TEMPLATES } from './templates';

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
    private inventoryService: InventoryService,
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
        where: { sku: candidate, shop_id: shopId },
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
        where: { sku: candidate, shop_id: shopId },
      });
      if (existing === 0) {
        return candidate;
      }
      count++;
      candidate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${count}`;
    }
  }

  async getMerchantProducts(shopId: string, query: { limit?: string; page?: string; search?: string; status?: string }) {
    const limit = Number(query.limit) || 200;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;
    const where: any = { shop_id: shopId };
    if (query.status) where.status = query.status;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: { gallery: { where: { is_cover: true }, take: 1 } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, pagination: { total, page, limit } };
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
          published_at: rest.status === 'active' ? new Date() : null,
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
          const stockQty = v.stock_qty !== undefined ? parseInt(v.stock_qty) : 0;
          const variant = await tx.productVariant.create({
            data: {
              shop_id: shopId,
              product_id: product.id,
              sku: varSku,
              label: v.label || 'Default',
              price: v.price !== undefined ? parseFloat(v.price) : product.price,
              compare_price: v.compare_price !== undefined ? parseFloat(v.compare_price) : product.compare_price,
              cost_price: v.cost_price !== undefined ? parseFloat(v.cost_price) : product.cost_price,
              stock_qty: stockQty,
              available_qty: stockQty,
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
            stock_qty: 0,
            available_qty: 0,
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
      // Set published_at the first time status is flipped to active
      let publishedAt: Date | undefined;
      if (rest.status === 'active') {
        const existing = await tx.product.findUnique({
          where: { id: productId },
          select: { published_at: true },
        });
        if (!existing?.published_at) publishedAt = new Date();
      }

      await tx.product.update({
        where: { id: productId, shop_id: shopId },
        data: {
          ...rest,
          published_at: publishedAt,
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

      // 8. Upsert variants if provided (create new, update existing by id)
      if (variants !== undefined && Array.isArray(variants)) {
        for (const v of variants) {
          const stockQty = v.stock_qty !== undefined ? parseInt(v.stock_qty) : undefined;
          const variantData: any = {
            label: v.label ?? undefined,
            price: v.price !== undefined ? parseFloat(v.price) : undefined,
            compare_price: v.compare_price !== undefined ? parseFloat(v.compare_price) : undefined,
            cost_price: v.cost_price !== undefined ? parseFloat(v.cost_price) : undefined,
            barcode: v.barcode ?? undefined,
            image_url: v.image_url ?? undefined,
            weight: v.weight !== undefined ? parseFloat(v.weight) : undefined,
            length: v.length !== undefined ? parseFloat(v.length) : undefined,
            width: v.width !== undefined ? parseFloat(v.width) : undefined,
            height: v.height !== undefined ? parseFloat(v.height) : undefined,
            track_inventory: v.track_inventory !== undefined ? !!v.track_inventory : undefined,
            low_stock_at: v.low_stock_at !== undefined ? parseInt(v.low_stock_at) : undefined,
            is_active: v.is_active !== undefined ? !!v.is_active : undefined,
            sort_order: v.sort_order !== undefined ? parseInt(v.sort_order) : undefined,
          };

          if (stockQty !== undefined) {
            variantData.stock_qty = stockQty;
            // Recalculate available_qty when stock changes (keep reserved_qty unchanged)
            const existing = v.id
              ? await tx.productVariant.findUnique({ where: { id: v.id }, select: { reserved_qty: true } })
              : null;
            const reserved = existing?.reserved_qty ?? 0;
            variantData.available_qty = Math.max(0, stockQty - reserved);
          }

          if (v.id) {
            // Update existing variant
            await tx.productVariant.update({
              where: { id: v.id, shop_id: shopId },
              data: variantData,
            });
            if (v.attributes && Array.isArray(v.attributes)) {
              await tx.variantAttribute.deleteMany({ where: { variant_id: v.id } });
              if (v.attributes.length > 0) {
                await tx.variantAttribute.createMany({
                  data: v.attributes.map((attr: any, idx: number) => ({
                    shop_id: shopId, variant_id: v.id,
                    attr_key: attr.attr_key || attr.name || '',
                    attr_value: attr.attr_value || attr.value || '',
                    sort_order: attr.sort_order ?? idx,
                  })),
                });
              }
            }
          } else {
            // Create new variant
            const varSku = await this.generateUniqueSku(shopId, rest.name || productId, v.sku);
            const newVariant = await tx.productVariant.create({
              data: {
                shop_id: shopId, product_id: productId,
                sku: varSku,
                label: v.label || 'Default',
                price: v.price !== undefined ? parseFloat(v.price) : 0,
                compare_price: v.compare_price !== undefined ? parseFloat(v.compare_price) : null,
                cost_price: v.cost_price !== undefined ? parseFloat(v.cost_price) : null,
                stock_qty: stockQty ?? 0,
                available_qty: stockQty ?? 0,
                track_inventory: v.track_inventory !== undefined ? !!v.track_inventory : true,
                low_stock_at: v.low_stock_at !== undefined ? parseInt(v.low_stock_at) : 5,
                barcode: v.barcode || null,
                image_url: v.image_url || null,
                is_active: v.is_active !== undefined ? !!v.is_active : true,
              },
            });
            if (v.attributes && Array.isArray(v.attributes) && v.attributes.length > 0) {
              await tx.variantAttribute.createMany({
                data: v.attributes.map((attr: any, idx: number) => ({
                  shop_id: shopId, variant_id: newVariant.id,
                  attr_key: attr.attr_key || attr.name || '',
                  attr_value: attr.attr_value || attr.value || '',
                  sort_order: attr.sort_order ?? idx,
                })),
              });
            }
          }
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

  async getCategories(shopId: string) {
    return this.prisma.category.findMany({
      where: { shop_id: shopId, is_active: true },
      select: { id: true, name: true, slug: true, parent_id: true, sort_order: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  async bulkEnsureCategories(
    shopId: string,
    items: { name: string; slug: string; parent_slug?: string }[],
  ) {
    const results: Record<string, string> = {};

    // First pass: create/find parents (items without parent_slug)
    for (const item of items.filter(i => !i.parent_slug)) {
      const existing = await this.prisma.category.findUnique({
        where: { shop_id_slug: { shop_id: shopId, slug: item.slug } },
      });
      if (existing) {
        results[item.slug] = existing.id;
      } else {
        const created = await this.prisma.category.create({
          data: { shop_id: shopId, name: item.name, slug: item.slug },
        });
        results[item.slug] = created.id;
      }
    }

    // Second pass: create/find children
    for (const item of items.filter(i => !!i.parent_slug)) {
      const parentId = item.parent_slug ? results[item.parent_slug] : undefined;
      const existing = await this.prisma.category.findUnique({
        where: { shop_id_slug: { shop_id: shopId, slug: item.slug } },
      });
      if (existing) {
        results[item.slug] = existing.id;
      } else {
        const created = await this.prisma.category.create({
          data: { shop_id: shopId, name: item.name, slug: item.slug, parent_id: parentId },
        });
        results[item.slug] = created.id;
      }
    }

    return results;
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

  async getOrders(
    shopId: string,
    query?: {
      page?: number; limit?: number;
      status?: string; fulfillment_status?: string;
      search?: string;
      from?: string; to?: string;
    },
  ) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 30;
    const skip = (page - 1) * limit;

    const where: any = { shop_id: shopId };
    if (query?.status) where.status = query.status;
    if (query?.fulfillment_status) where.fulfillment_status = query.fulfillment_status;
    if (query?.from || query?.to) {
      where.created_at = {};
      if (query.from) where.created_at.gte = new Date(query.from);
      if (query.to) where.created_at.lte = new Date(query.to);
    }
    if (query?.search) {
      where.OR = [
        { order_number: { contains: query.search, mode: 'insensitive' } },
        { guest_email: { contains: query.search, mode: 'insensitive' } },
        { guest_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { select: { id: true, qty: true, unit_price: true, line_total: true, product_snap: true } },
          payments: { orderBy: { created_at: 'desc' }, take: 1 },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOrderDetail(shopId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { shop_id: shopId, id: orderId },
      include: {
        items: true,
        status_logs: { orderBy: { created_at: 'asc' } },
        tracking: { orderBy: { occurred_at: 'asc' } },
        refunds: { include: { items: true } },
        payments: { orderBy: { created_at: 'desc' } },
        coupon: { select: { code: true, type: true, value: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
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
      paid_amount?: number;
      payment_method?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId, shop_id: shopId } });
    if (!order) throw new NotFoundException('Order not found');

    // Prevent invalid transitions
    if (order.status === 'delivered' && status === 'cancelled') {
      throw new BadRequestException('Cannot cancel a delivered order. Process a refund instead.');
    }
    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled.');
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
        if (extra.paid_amount !== undefined) {
          const val = parseFloat(String(extra.paid_amount));
          updateData.paid_amount = isNaN(val) ? null : val;
        }
        if (extra.payment_method !== undefined) updateData.payment_method = extra.payment_method || null;
      }

      if (status === 'shipped' && !updateData.fulfillment_status) {
        updateData.fulfillment_status = 'fulfilled';
        if (!updateData.dispatched_at) updateData.dispatched_at = new Date();
      }
      if (status === 'delivered' && !updateData.fulfillment_status) {
        updateData.fulfillment_status = 'delivered';
      }
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date();
        updateData.fulfillment_status = 'unfulfilled';
      }

      const updatedOrder = await tx.order.update({ where: { id: orderId }, data: updateData });

      // Restore inventory when cancelling — only if stock was actually deducted.
      // Stock is deducted at 'confirmed' (COD auto-confirms, Razorpay confirms on payment verify).
      // Pending orders (unpaid Razorpay) never had stock deducted — restore would inflate stock.
      // For pending orders, release any cart reservation that was held through checkout.
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const wasShipped = ['fulfilled', 'shipped', 'delivered'].includes(order.fulfillment_status);
        const stockWasDeducted = ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status);
        if (!wasShipped && stockWasDeducted) {
          await this.inventoryService.restoreStockForOrder(shopId, orderId, tx);
        } else if (order.status === 'pending') {
          // Release reservation held from checkout (cart was deleted but reserved_qty persisted)
          const items = await tx.orderItem.findMany({ where: { order_id: orderId } });
          for (const item of items) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variant_id } });
            if (!variant?.track_inventory) continue;
            const releaseQty = Math.min(item.qty, variant.reserved_qty);
            if (releaseQty > 0) {
              await tx.productVariant.update({
                where: { id: item.variant_id },
                data: { reserved_qty: { decrement: releaseQty }, available_qty: { increment: releaseQty } },
              });
            }
          }
        }
      }

      if (status !== order.status || note) {
        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId,
            order_id: orderId,
            from_status: order.status,
            to_status: status,
            note: note || `Status changed to ${status}`,
          },
        });
      }

      // Auto-add tracking milestone for key status transitions
      const trackingMessage: Record<string, string> = {
        confirmed: 'Order confirmed and being prepared',
        processing: 'Order is being processed',
        shipped: `Order shipped${extra?.courier_name ? ` via ${extra.courier_name}` : ''}${extra?.tracking_number ? ` — ${extra.tracking_number}` : ''}`,
        delivered: 'Order delivered successfully',
        cancelled: 'Order cancelled by merchant',
      };
      if (trackingMessage[status] && status !== order.status) {
        await tx.orderTracking.create({
          data: {
            shop_id: shopId,
            order_id: orderId,
            status,
            message: trackingMessage[status],
            ...(status === 'shipped' && extra?.tracking_number
              ? { location: extra.tracking_number }
              : {}),
          },
        });
      }

      return updatedOrder;
    });
  }

  // Add a manual tracking milestone (e.g. from courier webhook or manual entry)
  async addOrderTracking(
    shopId: string,
    orderId: string,
    dto: { status: string; message?: string; location?: string; occurred_at?: string },
  ) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, shop_id: shopId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.orderTracking.create({
      data: {
        shop_id: shopId,
        order_id: orderId,
        status: dto.status,
        message: dto.message || null,
        location: dto.location || null,
        occurred_at: dto.occurred_at ? new Date(dto.occurred_at) : new Date(),
      },
    });
  }

  // ─── Refunds ───────────────────────────────────────────────────────────────

  async getRefunds(shopId: string, query?: { status?: string; page?: number; limit?: number }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 30;
    const skip = (page - 1) * limit;

    const where: any = { shop_id: shopId };
    if (query?.status) where.status = query.status;

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          items: true,
          order: { select: { order_number: true, total: true, payment_method: true, guest_email: true, customer_id: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { refunds, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async processRefund(
    shopId: string,
    refundId: string,
    action: 'approve' | 'reject' | 'process',
    dto?: { merchant_notes?: string; gateway_refund_id?: string; method?: string },
  ) {
    const refund = await this.prisma.refund.findFirst({
      where: { id: refundId, shop_id: shopId },
      include: { order: { include: { items: true } } },
    });
    if (!refund) throw new NotFoundException('Refund request not found');

    if (action === 'approve') {
      if (refund.status !== 'pending') throw new BadRequestException(`Cannot approve a refund with status "${refund.status}"`);
      return this.prisma.refund.update({
        where: { id: refundId },
        data: { status: 'approved', merchant_notes: dto?.merchant_notes || null },
      });
    }

    if (action === 'reject') {
      if (!['pending', 'approved'].includes(refund.status)) {
        throw new BadRequestException(`Cannot reject a refund with status "${refund.status}"`);
      }
      await this.prisma.refund.update({
        where: { id: refundId },
        data: { status: 'rejected', merchant_notes: dto?.merchant_notes || null },
      });
      // Restore refund_status on order to 'none'
      const otherPending = await this.prisma.refund.count({
        where: { order_id: refund.order_id, status: { in: ['pending', 'approved', 'processed'] }, id: { not: refundId } },
      });
      if (otherPending === 0) {
        await this.prisma.order.update({ where: { id: refund.order_id }, data: { refund_status: 'none' } });
      }
      return { success: true, message: 'Refund rejected' };
    }

    if (action === 'process') {
      if (refund.status !== 'approved') throw new BadRequestException('Refund must be approved before processing');

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.refund.update({
          where: { id: refundId },
          data: {
            status: 'processed',
            processed_at: new Date(),
            merchant_notes: dto?.merchant_notes || refund.merchant_notes,
            gateway_refund_id: dto?.gateway_refund_id || null,
            method: dto?.method || refund.method,
          },
        });

        // Update refunded_qty on order items
        const refundItems = await tx.refundItem.findMany({ where: { refund_id: refundId } });
        for (const ri of refundItems) {
          await tx.orderItem.update({
            where: { id: ri.order_item_id },
            data: { refunded_qty: { increment: ri.qty } },
          });
        }

        // Determine if fully or partially refunded
        const orderTotal = Number(refund.order.total);
        const refundedTotal = Number(refund.refund_amount);
        const refundStatus = refundedTotal >= orderTotal ? 'refunded' : 'partial';
        await tx.order.update({ where: { id: refund.order_id }, data: { refund_status: refundStatus } });

        return updated;
      });
    }

    throw new BadRequestException('Invalid action. Use approve, reject, or process.');
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
    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
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
    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';

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
      const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
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
      include: { _count: { select: { products: true } } },
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
          data: { shop_id: shopId, name: d.name, slug: d.slug, description: d.description, is_active: true },
          include: { _count: { select: { products: true } } },
        });
        collections.push(col);
      }
    }

    return collections;
  }

  async getCollectionById(shopId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, shop_id: shopId },
      include: {
        _count: { select: { products: true } },
        products: { select: { product_id: true } },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async syncCollectionProducts(shopId: string, id: string, productIds: string[]) {
    const collection = await this.prisma.collection.findFirst({ where: { id, shop_id: shopId } });
    if (!collection) throw new NotFoundException('Collection not found');
    await this.prisma.collectionProduct.deleteMany({ where: { collection_id: id } });
    if (productIds.length > 0) {
      await this.prisma.collectionProduct.createMany({
        data: productIds.map(pid => ({ collection_id: id, product_id: pid })),
        skipDuplicates: true,
      });
    }
    return { success: true, count: productIds.length };
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

  async updateCollection(shopId: string, id: string, dto: { name?: string; description?: string; image_url?: string; is_active?: boolean }) {
    return this.prisma.collection.updateMany({
      where: { id, shop_id: shopId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image_url !== undefined && { image_url: dto.image_url }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
  }

  async deleteCollection(shopId: string, id: string) {
    await this.prisma.collection.deleteMany({ where: { id, shop_id: shopId } });
    return { success: true };
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
        sections: dto.sections || null,
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
        sections: dto.sections !== undefined ? dto.sections : undefined,
        status: dto.status !== undefined ? dto.status : undefined
      }
    });
  }

  async deleteAdminPage(shopId: string, id: string) {
    await this.getAdminPageById(shopId, id);
    return this.prisma.page.delete({ where: { id } });
  }

  async saveDraftSections(shopId: string, id: string, sections: any[]) {
    await this.getAdminPageById(shopId, id);
    const json = JSON.stringify(sections);
    await this.prisma.$executeRawUnsafe(
      `UPDATE pages SET draft_sections = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      json,
      id,
    );
    return this.getAdminPageById(shopId, id);
  }

  async publishPage(shopId: string, id: string) {
    await this.getAdminPageById(shopId, id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE pages SET sections = COALESCE(draft_sections, sections), status = 'published', updated_at = NOW() WHERE id = $1`,
      id,
    );
    return this.getAdminPageById(shopId, id);
  }

  async unpublishPage(shopId: string, id: string) {
    await this.getAdminPageById(shopId, id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE pages SET status = 'draft', updated_at = NOW() WHERE id = $1`,
      id,
    );
    return this.getAdminPageById(shopId, id);
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

  // ─── Coupons ──────────────────────────────────────────────────────────────

  async getCoupons(shopId: string) {
    return this.prisma.coupon.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getCoupon(shopId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, shop_id: shopId } });
    if (!coupon) throw new Error('Coupon not found');
    return coupon;
  }

  async createCoupon(shopId: string, dto: {
    code: string;
    type: string;
    value: number;
    min_order?: number;
    applies_to?: string;
    target_ids?: string[];
    usage_limit?: number;
    per_customer_limit?: number;
    free_shipping?: boolean;
    starts_at?: string;
    ends_at?: string;
    is_active?: boolean;
  }) {
    return this.prisma.coupon.create({
      data: {
        shop_id: shopId,
        code: dto.code.toUpperCase().trim(),
        type: dto.type,
        value: dto.value,
        min_order: dto.min_order ?? 0,
        applies_to: dto.applies_to ?? 'all',
        target_ids: dto.target_ids ?? [],
        usage_limit: dto.usage_limit ?? null,
        per_customer_limit: dto.per_customer_limit ?? null,
        free_shipping: dto.free_shipping ?? false,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
        ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async updateCoupon(shopId: string, id: string, dto: Partial<{
    code: string;
    type: string;
    value: number;
    min_order: number;
    applies_to: string;
    target_ids: string[];
    usage_limit: number | null;
    per_customer_limit: number | null;
    free_shipping: boolean;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
  }>) {
    const existing = await this.prisma.coupon.findFirst({ where: { id, shop_id: shopId } });
    if (!existing) throw new Error('Coupon not found');
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.toUpperCase().trim() }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.min_order !== undefined && { min_order: dto.min_order }),
        ...(dto.applies_to !== undefined && { applies_to: dto.applies_to }),
        ...(dto.target_ids !== undefined && { target_ids: dto.target_ids }),
        ...(dto.usage_limit !== undefined && { usage_limit: dto.usage_limit }),
        ...(dto.per_customer_limit !== undefined && { per_customer_limit: dto.per_customer_limit }),
        ...(dto.free_shipping !== undefined && { free_shipping: dto.free_shipping }),
        ...(dto.starts_at !== undefined && { starts_at: dto.starts_at ? new Date(dto.starts_at) : null }),
        ...(dto.ends_at !== undefined && { ends_at: dto.ends_at ? new Date(dto.ends_at) : null }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
  }

  async deleteCoupon(shopId: string, id: string) {
    const existing = await this.prisma.coupon.findFirst({ where: { id, shop_id: shopId } });
    if (!existing) throw new Error('Coupon not found');
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  async getCouponUsage(shopId: string, id: string) {
    const existing = await this.prisma.coupon.findFirst({ where: { id, shop_id: shopId } });
    if (!existing) throw new Error('Coupon not found');
    return this.prisma.couponUsage.findMany({
      where: { coupon_id: id },
      orderBy: { used_at: 'desc' },
      take: 100,
    });
  }
}
