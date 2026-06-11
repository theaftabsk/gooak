import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PageBuilderService {
  constructor(private prisma: PrismaService) {}

  async getPages(shopId: string) {
    return this.prisma.page.findMany({
      where: { shop_id: shopId },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getPageById(shopId: string, id: string) {
    const page = await this.prisma.page.findFirst({
      where: { id, shop_id: shopId },
      include: {
        widgets: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    return page;
  }

  async getPageBySlug(shopId: string, slug: string) {
    // If slug is empty or root, look for an 'index' slug or the first page
    const actualSlug = slug === '/' || slug === '' ? 'index' : slug;

    const page = await this.prisma.page.findFirst({
      where: { slug: actualSlug, shop_id: shopId },
      include: {
        widgets: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    return page;
  }

  async savePage(shopId: string, payload: {
    id?: string;
    title: string;
    slug: string;
    type: 'NORMAL' | 'COLLECTION';
    theme: any;
    widgets: any[];
  }) {
    const { id, title, slug, type, theme, widgets } = payload;

    // Use transaction to ensure page and widgets are saved atomically
    return this.prisma.$transaction(async (tx) => {
      let page;

      if (id) {
        // Update existing page
        page = await tx.page.findFirst({
          where: { id, shop_id: shopId },
        });

        if (!page) {
          throw new NotFoundException(`Page not found to update`);
        }

        page = await tx.page.update({
          where: { id },
          data: {
            title,
            slug,
            type,
            theme: theme || undefined,
          },
        });
      } else {
        // Create new page
        page = await tx.page.create({
          data: {
            shop_id: shopId,
            title,
            slug,
            type,
            theme: theme || undefined,
          },
        });
      }

      // Recreate widgets: Delete old widgets and insert new ones
      await tx.widget.deleteMany({
        where: { page_id: page.id },
      });

      if (widgets && widgets.length > 0) {
        await tx.widget.createMany({
          data: widgets.map((w, index) => ({
            page_id: page.id,
            type: w.type,
            sort_order: index,
            content: w.content || {},
            styles: w.styles || {},
          })),
        });
      }

      // Fetch and return the fully populated page
      return tx.page.findUnique({
        where: { id: page.id },
        include: {
          widgets: {
            orderBy: { sort_order: 'asc' },
          },
        },
      });
    });
  }

  async publishPage(shopId: string, id: string) {
    const page = await this.prisma.page.findFirst({
      where: { id, shop_id: shopId },
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    return this.prisma.page.update({
      where: { id },
      data: { is_published: true },
    });
  }

  async deletePage(shopId: string, id: string) {
    const page = await this.prisma.page.findFirst({
      where: { id, shop_id: shopId },
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    await this.prisma.page.delete({
      where: { id },
    });

    return { success: true };
  }
}
