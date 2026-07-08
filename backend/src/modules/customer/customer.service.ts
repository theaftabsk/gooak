import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async customerRegister(shopId: string, dto: { name: string; email: string; phone?: string; password: string }) {
    const bcrypt = await import('bcryptjs');

    const existing = await this.tenantPrisma.customer.findFirst({
      where: { shop_id: shopId, email: { equals: dto.email.trim(), mode: 'insensitive' } },
    });
    if (existing) throw new BadRequestException('An account with this email already exists.');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const customer = await this.tenantPrisma.customer.create({
      data: { shop_id: shopId, name: dto.name, email: dto.email, phone: dto.phone || null, password_hash, is_verified: false },
      select: { id: true, name: true, email: true, phone: true, avatar_url: true, created_at: true },
    });

    const token = this.signToken(customer.id, shopId);
    return { customer, token };
  }

  async customerLogin(shopId: string, dto: { email: string; password: string }) {
    const bcrypt = await import('bcryptjs');
    const customer = await this.tenantPrisma.customer.findFirst({
      where: { shop_id: shopId, email: { equals: dto.email.trim(), mode: 'insensitive' } },
    });

    if (!customer) throw new BadRequestException('Invalid email or password.');
    const valid = await bcrypt.compare(dto.password, customer.password_hash || '');
    if (!valid) throw new BadRequestException('Invalid email or password.');

    const token = this.signToken(customer.id, shopId);
    const { password_hash, ...customerData } = customer;
    return { customer: customerData, token };
  }

  async getCustomerMe(shopId: string, customerId: string) {
    const customer = await this.tenantPrisma.customer.findFirst({
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
    name?: string; phone?: string; avatar_url?: string;
    current_password?: string; new_password?: string;
  }) {
    const bcrypt = await import('bcryptjs');
    const data: any = {};
    // Always verify the customer belongs to this shop before accepting any update
    const existing = await this.tenantPrisma.customer.findFirst({ where: { id: customerId, shop_id: shopId } });
    if (!existing) throw new NotFoundException('Customer not found.');

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url;

    if (dto.new_password) {
      if (!dto.current_password) throw new BadRequestException('Current password is required.');
      const customer = await this.tenantPrisma.customer.findFirst({ where: { id: customerId, shop_id: shopId } });
      const valid = await bcrypt.compare(dto.current_password, customer?.password_hash || '');
      if (!valid) throw new BadRequestException('Current password is incorrect.');
      data.password_hash = await bcrypt.hash(dto.new_password, 10);
    }

    return this.tenantPrisma.customer.update({
      where: { id: customerId },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar_url: true, created_at: true },
    });
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  async getCustomerOrders(shopId: string, customerId: string, query?: { page?: number; limit?: number; status?: string }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { shop_id: shopId, customer_id: customerId };
    if (query?.status) where.status = query.status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.summarizeOrder(o)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderDetail(shopId: string, customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { shop_id: shopId, customer_id: customerId, id: orderId },
      include: {
        items: true,
        status_logs: { orderBy: { created_at: 'asc' } },
        tracking: { orderBy: { occurred_at: 'asc' } },
        refunds: { where: { status: { not: 'rejected' } }, include: { items: true } },
        payments: { orderBy: { created_at: 'desc' }, take: 5 },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  // ─── Cancel Order ──────────────────────────────────────────────────────────
  // Customers can cancel orders that are still pending or confirmed (not yet shipped).
  // Stock is restored and, if paid, a refund request is auto-created.

  async cancelOrder(shopId: string, customerId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { shop_id: shopId, customer_id: customerId, id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    const cancellable = ['pending', 'confirmed'];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException(`Orders with status "${order.status}" cannot be cancelled. Contact support if the item hasn't shipped.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancel_reason: reason || null,
          fulfillment_status: 'cancelled',
        },
      });

      // Log status change
      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId,
          order_id: orderId,
          from_status: order.status,
          to_status: 'cancelled',
          note: reason ? `Customer cancelled: ${reason}` : 'Cancelled by customer',
        },
      });

      // Add tracking milestone
      await tx.orderTracking.create({
        data: { shop_id: shopId, order_id: orderId, status: 'cancelled', message: reason || 'Order cancelled by customer' },
      });

      if (order.status === 'confirmed') {
        // Stock was deducted at confirmation — restore physical units
        const warehouse = await tx.warehouse.findFirst({ where: { shop_id: shopId, is_active: true } });
        for (const item of order.items) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variant_id } });
          if (!variant || !variant.track_inventory) continue;
          const newStock = variant.stock_qty + item.qty;
          const newAvailable = Math.max(0, newStock - variant.reserved_qty);
          await tx.productVariant.update({
            where: { id: item.variant_id },
            data: {
              stock_qty: newStock,
              available_qty: newAvailable,
              total_sold: Math.max(0, variant.total_sold - item.qty),
            },
          });
          if (warehouse) {
            await tx.inventoryLog.create({
              data: {
                shop_id: shopId,
                variant_id: item.variant_id,
                warehouse_id: warehouse.id,
                type: 'return',
                qty_change: item.qty,
                qty_after: newStock,
                ref_id: orderId,
                note: `Stock restored on order cancellation: ${order.order_number}`,
              },
            });
          }
        }
      } else if (order.status === 'pending') {
        // Razorpay order — payment never completed so stock was never deducted.
        // But reservation was held when the cart was checked out; release it now.
        for (const item of order.items) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variant_id } });
          if (!variant || !variant.track_inventory) continue;
          const releaseQty = Math.min(item.qty, variant.reserved_qty);
          if (releaseQty > 0) {
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: {
                reserved_qty: { decrement: releaseQty },
                available_qty: { increment: releaseQty },
              },
            });
          }
        }
      }

      // Auto-create refund request if order was paid
      if (order.paid_amount && Number(order.paid_amount) > 0) {
        await tx.refund.create({
          data: {
            shop_id: shopId,
            order_id: orderId,
            requested_by: 'customer',
            reason: `Order cancelled by customer. ${reason || ''}`.trim(),
            status: 'pending',
            refund_amount: order.paid_amount,
            method: 'original_payment',
          },
        });
        await tx.order.update({ where: { id: orderId }, data: { refund_status: 'requested' } });
      }

      return { success: true, message: 'Order cancelled successfully.' };
    });
  }

  // ─── Refunds ───────────────────────────────────────────────────────────────
  // Customers request refunds on delivered orders.
  // Merchant approves/rejects via /merchant/refunds/:id.

  async requestRefund(
    shopId: string,
    customerId: string,
    orderId: string,
    dto: {
      reason: string;
      items: { order_item_id: string; qty: number }[];
      method?: string;
    },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { shop_id: shopId, customer_id: customerId, id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    const refundableStatuses = ['delivered', 'completed'];
    if (!refundableStatuses.includes(order.status)) {
      throw new BadRequestException('Refunds can only be requested for delivered orders.');
    }
    if (order.refund_status === 'refunded') throw new BadRequestException('This order has already been fully refunded.');

    // Existing pending/approved refund
    const existingRefund = await this.prisma.refund.findFirst({
      where: { order_id: orderId, status: { in: ['pending', 'approved'] } },
    });
    if (existingRefund) throw new BadRequestException('A refund request is already in progress for this order.');

    // Validate items and calculate amount
    let refundAmount = 0;
    const refundItems: { order_item_id: string; qty: number; amount: number }[] = [];

    for (const reqItem of dto.items) {
      const orderItem = order.items.find((i) => i.id === reqItem.order_item_id);
      if (!orderItem) throw new BadRequestException(`Order item ${reqItem.order_item_id} not found in this order.`);

      const maxRefundQty = orderItem.qty - orderItem.refunded_qty;
      if (reqItem.qty > maxRefundQty) {
        throw new BadRequestException(`Cannot refund ${reqItem.qty} units — only ${maxRefundQty} eligible.`);
      }

      const itemAmount = (Number(orderItem.unit_price) - Number(orderItem.discount_amount) / orderItem.qty) * reqItem.qty;
      refundAmount += itemAmount;
      refundItems.push({ order_item_id: reqItem.order_item_id, qty: reqItem.qty, amount: itemAmount });
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          shop_id: shopId,
          order_id: orderId,
          requested_by: 'customer',
          reason: dto.reason,
          status: 'pending',
          refund_amount: refundAmount,
          method: dto.method || 'original_payment',
          items: { create: refundItems.map((i) => ({ shop_id: shopId, order_item_id: i.order_item_id, qty: i.qty, amount: i.amount })) },
        },
        include: { items: true },
      });

      await tx.order.update({ where: { id: orderId }, data: { refund_status: 'requested' } });

      return refund;
    });
  }

  async getMyRefunds(shopId: string, customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { shop_id: shopId, customer_id: customerId, refund_status: { not: 'none' } },
      select: { id: true, order_number: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length === 0) return [];

    const refunds = await this.prisma.refund.findMany({
      where: { order_id: { in: orderIds } },
      include: { items: true, order: { select: { order_number: true, total: true, created_at: true } } },
      orderBy: { created_at: 'desc' },
    });

    return refunds;
  }

  // ─── Wishlist ──────────────────────────────────────────────────────────────

  async getWishlist(shopId: string, customerId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { shop_id_customer_id: { shop_id: shopId, customer_id: customerId } },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
                attributes: { orderBy: { sort_order: 'asc' } },
              },
            },
          },
          orderBy: { added_at: 'desc' },
        },
      },
    });

    return wishlist?.items || [];
  }

  async addToWishlist(shopId: string, customerId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, shop_id: shopId, is_active: true },
    });
    if (!variant) throw new NotFoundException('Product variant not found.');

    // Upsert wishlist, then upsert item
    const wishlist = await this.prisma.wishlist.upsert({
      where: { shop_id_customer_id: { shop_id: shopId, customer_id: customerId } },
      create: { shop_id: shopId, customer_id: customerId },
      update: {},
    });

    const existing = await this.prisma.wishlistItem.findFirst({
      where: { wishlist_id: wishlist.id, variant_id: variantId },
    });

    if (!existing) {
      await this.prisma.wishlistItem.create({
        data: { shop_id: shopId, wishlist_id: wishlist.id, variant_id: variantId },
      });
    }

    return this.getWishlist(shopId, customerId);
  }

  async removeFromWishlist(shopId: string, customerId: string, variantId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { shop_id_customer_id: { shop_id: shopId, customer_id: customerId } },
    });
    if (!wishlist) return { success: true };

    await this.prisma.wishlistItem.deleteMany({
      where: { wishlist_id: wishlist.id, variant_id: variantId },
    });

    return { success: true };
  }

  // ─── Cart Merge ────────────────────────────────────────────────────────────
  // Called right after login: merges the guest session cart into the customer's cart.
  // Items that already exist in the customer cart have their qty summed (capped at stock).

  async mergeCart(shopId: string, guestSessionId: string, customerId: string) {
    const [guestCart, customerCart] = await Promise.all([
      this.prisma.cart.findFirst({ where: { shop_id: shopId, session_id: guestSessionId } }),
      this.prisma.cart.findFirst({ where: { shop_id: shopId, customer_id: customerId } }),
    ]);

    if (!guestCart) return { merged: 0 };

    const guestItems = await this.prisma.cartItem.findMany({ where: { cart_id: guestCart.id } });
    if (guestItems.length === 0) return { merged: 0 };

    let targetCart = customerCart;
    if (!targetCart) {
      targetCart = await this.prisma.cart.create({
        data: { shop_id: shopId, customer_id: customerId, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }

    let merged = 0;
    for (const gi of guestItems) {
      const variant = await this.prisma.productVariant.findUnique({ where: { id: gi.variant_id } });
      if (!variant || !variant.is_active) continue;

      // Release guest cart reservation before re-reserving under the customer cart
      if (variant.track_inventory) {
        const releaseQty = Math.min(gi.qty, variant.reserved_qty);
        if (releaseQty > 0) {
          await this.prisma.productVariant.update({
            where: { id: gi.variant_id },
            data: { reserved_qty: { decrement: releaseQty }, available_qty: { increment: releaseQty } },
          });
        }
      }

      // Re-read available_qty after releasing guest reservation
      const fresh = await this.prisma.productVariant.findUnique({
        where: { id: gi.variant_id },
        select: { available_qty: true, reserved_qty: true },
      });
      const cap = variant.track_inventory ? (fresh?.available_qty ?? 0) : 9999;

      const existing = await this.prisma.cartItem.findFirst({
        where: { cart_id: targetCart.id, variant_id: gi.variant_id },
      });

      if (existing) {
        const addQty = Math.min(gi.qty, Math.max(0, cap));
        const newQty = existing.qty + addQty;
        if (addQty > 0) {
          await this.prisma.cartItem.update({ where: { id: existing.id }, data: { qty: newQty } });
          if (variant.track_inventory) {
            await this.prisma.productVariant.update({
              where: { id: gi.variant_id },
              data: { reserved_qty: { increment: addQty }, available_qty: { decrement: addQty } },
            });
          }
        }
      } else {
        const qty = Math.min(gi.qty, Math.max(0, cap));
        if (qty > 0) {
          await this.prisma.cartItem.create({
            data: { shop_id: shopId, cart_id: targetCart.id, variant_id: gi.variant_id, qty, unit_price: variant.price },
          });
          if (variant.track_inventory) {
            await this.prisma.productVariant.update({
              where: { id: gi.variant_id },
              data: { reserved_qty: { increment: qty }, available_qty: { decrement: qty } },
            });
          }
        }
      }
      merged++;
    }

    // Transfer coupon from guest cart if customer cart has none
    if (guestCart.coupon_id && !targetCart.coupon_id) {
      await this.prisma.cart.update({ where: { id: targetCart.id }, data: { coupon_id: guestCart.coupon_id } });
    }

    // Delete guest cart (reservations already released above, per item)
    await this.prisma.cartItem.deleteMany({ where: { cart_id: guestCart.id } });
    await this.prisma.cart.delete({ where: { id: guestCart.id } });

    return { merged, cart_id: targetCart.id };
  }

  // ─── Token ─────────────────────────────────────────────────────────────────

  private signToken(customerId: string, shopId: string): string {
    const secret = process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    return jwt.sign({ customerId, shopId }, secret, { expiresIn: '30d' });
  }

  async verifyCustomerToken(token: string): Promise<{ customerId: string; shopId: string }> {
    const secret = process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    try {
      const payload = jwt.verify(token, secret) as any;
      return { customerId: payload.customerId, shopId: payload.shopId };
    } catch {
      throw new UnauthorizedException('Invalid or expired customer token.');
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private summarizeOrder(o: any) {
    return {
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      fulfillment_status: o.fulfillment_status,
      refund_status: o.refund_status,
      total: o.total,
      item_count: o.items?.reduce((n: number, i: any) => n + i.qty, 0) || 0,
      payment_method: o.payment_method,
      coupon_code: o.coupon_code,
      created_at: o.created_at,
      items: o.items,
    };
  }
}
