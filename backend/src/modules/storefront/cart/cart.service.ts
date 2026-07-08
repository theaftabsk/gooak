import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async resolveCart(shopId: string, sessionId?: string, customerId?: string) {
    if (!sessionId && !customerId) throw new BadRequestException('session_id or customer auth required');

    const where: any = { shop_id: shopId };
    if (customerId) where.customer_id = customerId;
    else where.session_id = sessionId;

    return this.prisma.cart.findFirst({ where });
  }

  async getCart(shopId: string, sessionId?: string, customerId?: string) {
    const cart = await this.resolveCart(shopId, sessionId, customerId);
    if (!cart) return this.buildCartResponse(null, []);

    const items = await this.prisma.cartItem.findMany({
      where: { cart_id: cart.id },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            attributes: { orderBy: { sort_order: 'asc' } },
          },
        },
      },
    });

    let coupon: any = null;
    if (cart.coupon_id) {
      coupon = await this.prisma.coupon.findUnique({ where: { id: cart.coupon_id } });
    }

    return this.buildCartResponse(cart, items, coupon);
  }

  buildCartResponse(cart: any, items: any[], coupon?: any) {
    const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.qty, 0);
    let discount = 0;
    let freeShipping = false;

    if (coupon) {
      if (coupon.type === 'percentage') discount = (subtotal * Number(coupon.value)) / 100;
      else if (coupon.type === 'fixed') discount = Math.min(Number(coupon.value), subtotal);
      else if (coupon.type === 'free_shipping') freeShipping = true;
      if (coupon.free_shipping) freeShipping = true;
    }

    const shipping = freeShipping ? 0 : subtotal >= 500 ? 0 : 50;
    const total = Math.max(0, subtotal - discount + shipping);

    return {
      cart_id: cart?.id || null,
      items: items.map((i) => ({
        id: i.id,
        variant_id: i.variant_id,
        qty: i.qty,
        unit_price: Number(i.unit_price),
        line_total: Number(i.unit_price) * i.qty,
        variant: {
          sku: i.variant.sku,
          label: i.variant.label,
          image_url: i.variant.image_url,
          available_qty: i.variant.available_qty,
          track_inventory: i.variant.track_inventory,
          in_stock: !i.variant.track_inventory || i.variant.available_qty > 0,
          attributes: i.variant.attributes,
          product: i.variant.product,
        },
      })),
      coupon: coupon
        ? { code: coupon.code, type: coupon.type, value: Number(coupon.value), free_shipping: coupon.free_shipping }
        : null,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      item_count: items.reduce((n, i) => n + i.qty, 0),
    };
  }

  async addToCart(shopId: string, dto: { session_id?: string; customer_id?: string; variant_id: string; qty: number }) {
    const { session_id, customer_id, variant_id, qty } = dto;
    if (!session_id && !customer_id) throw new BadRequestException('session_id or customer_id required');
    if (qty < 1) throw new BadRequestException('qty must be at least 1');

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variant_id, shop_id: shopId, is_active: true },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.track_inventory && variant.available_qty < qty) {
      throw new BadRequestException(
        variant.available_qty <= 0 ? 'This item is out of stock' : `Only ${variant.available_qty} available`,
      );
    }

    let cart = await this.resolveCart(shopId, session_id, customer_id);
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          shop_id: shopId,
          ...(customer_id ? { customer_id } : { session_id }),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const existing = await this.prisma.cartItem.findFirst({ where: { cart_id: cart.id, variant_id } });
    if (existing) {
      const additionalQty = qty - existing.qty;  // net new qty being added
      if (variant.track_inventory && additionalQty > 0 && variant.available_qty < additionalQty) {
        throw new BadRequestException(`Only ${variant.available_qty} more units available`);
      }
      // Adjust reservation for the delta
      if (variant.track_inventory && additionalQty !== 0) {
        await this.prisma.productVariant.update({
          where: { id: variant_id },
          data: {
            reserved_qty: { increment: additionalQty },
            available_qty: { decrement: additionalQty },
          },
        });
      }
      await this.prisma.cartItem.update({ where: { id: existing.id }, data: { qty, unit_price: variant.price } });
    } else {
      // Reserve stock on first add
      if (variant.track_inventory) {
        await this.prisma.productVariant.update({
          where: { id: variant_id },
          data: {
            reserved_qty: { increment: qty },
            available_qty: { decrement: qty },
          },
        });
      }
      await this.prisma.cartItem.create({
        data: { shop_id: shopId, cart_id: cart.id, variant_id, qty, unit_price: variant.price },
      });
    }

    await this.prisma.cart.update({ where: { id: cart.id }, data: { updated_at: new Date() } });
    return this.getCart(shopId, session_id, customer_id);
  }

  async updateCartItem(shopId: string, itemId: string, qty: number, sessionId?: string, customerId?: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, shop_id: shopId },
      include: { cart: true, variant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    const ownerMatch = customerId ? item.cart.customer_id === customerId : item.cart.session_id === sessionId;
    if (!ownerMatch) throw new BadRequestException('Cart item does not belong to this session');

    if (qty <= 0) {
      // Release the reservation held for this item
      if (item.variant.track_inventory) {
        await this.prisma.productVariant.update({
          where: { id: item.variant_id },
          data: {
            reserved_qty: { decrement: item.qty },
            available_qty: { increment: item.qty },
          },
        });
      }
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const delta = qty - item.qty;
      if (item.variant.track_inventory) {
        if (delta > 0 && item.variant.available_qty < delta) {
          throw new BadRequestException(`Only ${item.variant.available_qty} more units available`);
        }
        if (delta !== 0) {
          await this.prisma.productVariant.update({
            where: { id: item.variant_id },
            data: {
              reserved_qty: { increment: delta },
              available_qty: { decrement: delta },
            },
          });
        }
      }
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    }

    return this.getCart(shopId, sessionId, customerId);
  }

  async removeCartItem(shopId: string, itemId: string, sessionId?: string, customerId?: string) {
    return this.updateCartItem(shopId, itemId, 0, sessionId, customerId);
  }

  async applyCoupon(shopId: string, code: string, sessionId?: string, customerId?: string, guestEmail?: string) {
    const cart = await this.resolveCart(shopId, sessionId, customerId);
    if (!cart) throw new NotFoundException('Cart not found');

    const coupon = await this.prisma.coupon.findFirst({
      where: { shop_id: shopId, code: { equals: code, mode: 'insensitive' }, is_active: true },
    });
    if (!coupon) throw new BadRequestException('Invalid or inactive coupon code');

    const now = new Date();
    if (coupon.starts_at && coupon.starts_at > now) throw new BadRequestException('Coupon is not yet active');
    if (coupon.ends_at && coupon.ends_at < now) throw new BadRequestException('Coupon has expired');
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.per_customer_limit !== null && (customerId || guestEmail)) {
      const usageWhere: any = { coupon_id: coupon.id };
      if (customerId) usageWhere.customer_id = customerId;
      else if (guestEmail) usageWhere.guest_email = guestEmail;
      const used = await this.prisma.couponUsage.count({ where: usageWhere });
      if (used >= coupon.per_customer_limit) {
        throw new BadRequestException('You have already used this coupon the maximum number of times');
      }
    }

    const cartItems = await this.prisma.cartItem.findMany({ where: { cart_id: cart.id } });
    const subtotal = cartItems.reduce((s, i) => s + Number(i.unit_price) * i.qty, 0);
    if (Number(coupon.min_order) > 0 && subtotal < Number(coupon.min_order)) {
      throw new BadRequestException(`Minimum order of ${coupon.min_order} required for this coupon`);
    }

    await this.prisma.cart.update({ where: { id: cart.id }, data: { coupon_id: coupon.id } });
    return this.getCart(shopId, sessionId, customerId);
  }

  async removeCoupon(shopId: string, sessionId?: string, customerId?: string) {
    const cart = await this.resolveCart(shopId, sessionId, customerId);
    if (!cart) throw new NotFoundException('Cart not found');
    await this.prisma.cart.update({ where: { id: cart.id }, data: { coupon_id: null } });
    return this.getCart(shopId, sessionId, customerId);
  }
}
