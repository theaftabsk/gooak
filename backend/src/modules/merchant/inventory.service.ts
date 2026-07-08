import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the first active warehouse for the shop; auto-creates a default one if none exist. */
  private async getOrCreateDefaultWarehouse(tx: any, shopId: string) {
    let warehouse = await tx.warehouse.findFirst({
      where: { shop_id: shopId, is_active: true },
      select: { id: true },
    });
    if (!warehouse) {
      warehouse = await tx.warehouse.create({
        data: { shop_id: shopId, name: 'Main Warehouse', is_active: true },
        select: { id: true },
      });
    }
    return warehouse;
  }

  /**
   * Central stock writer — all stock mutations go through here.
   * Keeps stock_qty, available_qty, and reserved_qty consistent and always writes an InventoryLog.
   */
  async writeStockChange(
    tx: any,
    shopId: string,
    variantId: string,
    delta: number,
    opts: {
      type: 'sale' | 'manual' | 'adjustment' | 'return' | 'damage' | 'correction' | 'restock';
      refId?: string;
      note?: string;
      createdBy?: string;
      releaseReserved?: number;  // qty to release from reserved_qty simultaneously
    },
  ) {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { stock_qty: true, reserved_qty: true, track_inventory: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    const newStock = Math.max(0, variant.stock_qty + delta);
    const newReserved = Math.max(0, variant.reserved_qty - (opts.releaseReserved ?? 0));
    const newAvailable = Math.max(0, newStock - newReserved);

    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stock_qty: newStock,
        reserved_qty: newReserved,
        available_qty: newAvailable,
      },
    });

    const warehouse = await this.getOrCreateDefaultWarehouse(tx, shopId);
    await tx.inventoryLog.create({
      data: {
        shop_id: shopId,
        variant_id: variantId,
        warehouse_id: warehouse.id,
        type: opts.type,
        qty_change: delta,
        qty_after: newStock,
        ref_id: opts.refId ?? null,
        note: opts.note ?? null,
        created_by: opts.createdBy ?? null,
      },
    });

    return { previousQty: variant.stock_qty, newQty: newStock, newReserved, newAvailable };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async adjustStock(
    shopId: string,
    variantId: string,
    dto: { adjustment: number; type?: string; note?: string; createdBy?: string },
  ) {
    if (dto.adjustment === 0) throw new BadRequestException('adjustment cannot be 0');

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, shop_id: shopId },
      select: { stock_qty: true },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    const result = await this.prisma.$transaction(async (tx) => {
      return this.writeStockChange(tx, shopId, variantId, dto.adjustment, {
        type: (dto.type as any) || 'adjustment',
        note: dto.note,
        createdBy: dto.createdBy,
      });
    });

    return { variantId, ...result, adjustment: dto.adjustment };
  }

  /** Reserve qty when added to cart. Prevents overselling. */
  async reserveStock(shopId: string, variantId: string, qty: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, shop_id: shopId },
      select: { stock_qty: true, reserved_qty: true, available_qty: true, track_inventory: true },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    if (!variant.track_inventory) return;

    if (variant.available_qty < qty) {
      throw new BadRequestException(`Only ${variant.available_qty} units available`);
    }

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        reserved_qty: { increment: qty },
        available_qty: { decrement: qty },
      },
    });
  }

  /** Release reservation when cart item is removed or cart expires. */
  async releaseReservation(shopId: string, variantId: string, qty: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, shop_id: shopId },
      select: { reserved_qty: true, stock_qty: true },
    });
    if (!variant) return;

    const releaseQty = Math.min(qty, variant.reserved_qty);
    if (releaseQty === 0) return;

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        reserved_qty: { decrement: releaseQty },
        available_qty: { increment: releaseQty },
      },
    });
  }

  /** Restore stock after order cancellation. */
  async restoreStockForOrder(shopId: string, orderId: string, tx?: any) {
    const client = tx ?? this.prisma;
    const items = await client.orderItem.findMany({
      where: { order_id: orderId, shop_id: shopId },
      include: { variant: { select: { track_inventory: true } } },
    });

    for (const item of items) {
      if (!item.variant?.track_inventory) continue;
      const refundableQty = item.qty - item.refunded_qty;
      if (refundableQty <= 0) continue;

      await this.writeStockChange(client, shopId, item.variant_id, refundableQty, {
        type: 'return',
        refId: orderId,
        note: `Stock restored: order cancellation`,
      });
    }
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
      take: 100,
      include: { warehouse: { select: { name: true } } },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    return logs.map((log) => ({
      ...log,
      variant: variantMap.get(log.variant_id) ?? null,
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
            reserved_qty: true,
            available_qty: true,
            low_stock_at: true,
            track_inventory: true,
            is_active: true,
            sort_order: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const tracked = p.variants.filter((v) => v.track_inventory);
      const totalStock = tracked.reduce((sum, v) => sum + v.stock_qty, 0);
      const totalAvailable = tracked.reduce((sum, v) => sum + v.available_qty, 0);
      const totalReserved = tracked.reduce((sum, v) => sum + v.reserved_qty, 0);
      const outOfStock = tracked.filter((v) => v.available_qty === 0).length;
      const lowStock = tracked.filter((v) => v.available_qty > 0 && v.available_qty <= v.low_stock_at).length;
      return { ...p, totalStock, totalAvailable, totalReserved, outOfStock, lowStock };
    });
  }
}
