import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Create an inventory log if a warehouse exists for this shop
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

    return {
      variantId,
      previousQty: variant.stock_qty,
      newQty,
      adjustment: dto.adjustment,
    };
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

    // Attach variant label/sku metadata to each log
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

    // Compute per-product stock summary
    return products.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock_qty, 0);
      const outOfStock = p.variants.filter((v) => v.stock_qty === 0).length;
      const lowStock = p.variants.filter(
        (v) => v.stock_qty > 0 && v.stock_qty <= v.low_stock_at,
      ).length;
      return { ...p, totalStock, outOfStock, lowStock };
    });
  }
}
