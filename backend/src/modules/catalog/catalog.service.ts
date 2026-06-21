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
}

