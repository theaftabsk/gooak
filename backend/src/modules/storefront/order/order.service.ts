import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TenantPrismaService } from '../../../database/tenant-prisma.service';
import { CheckoutService } from '../checkout/checkout.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
    private checkoutService: CheckoutService,
    private cartService: CartService,
  ) {}

  async placeOrder(
    shopId: string,
    dto: {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      session_id?: string;
      customer_id?: string;
      items?: { variant_id: string; qty: number }[];
      shipping_address: any;
      payment_method: string;
      coupon_code?: string;
      notes?: string;
    },
  ) {
    let orderItems: { variant_id: string; qty: number }[] = [];
    let cartId: string | null = null;
    let appliedCoupon: any = null;

    if (dto.session_id || dto.customer_id) {
      const cart = await this.cartService.resolveCart(shopId, dto.session_id, dto.customer_id);
      if (!cart) throw new BadRequestException('Cart is empty');

      const cartItems = await this.prisma.cartItem.findMany({ where: { cart_id: cart.id } });
      if (cartItems.length === 0) throw new BadRequestException('Cart is empty');

      orderItems = cartItems.map((i) => ({ variant_id: i.variant_id, qty: i.qty }));
      cartId = cart.id;

      if (cart.coupon_id) {
        appliedCoupon = await this.prisma.coupon.findUnique({ where: { id: cart.coupon_id } });
      }
    } else if (dto.items?.length) {
      orderItems = dto.items;
    } else {
      throw new BadRequestException('No items to order');
    }

    if (dto.coupon_code && !appliedCoupon) {
      appliedCoupon = await this.prisma.coupon.findFirst({
        where: { shop_id: shopId, code: { equals: dto.coupon_code, mode: 'insensitive' }, is_active: true },
      });
    }

    const resolvedItems = await this.resolveOrderItems(shopId, orderItems);
    const variantIds = resolvedItems.map((i) => i.variant_id);

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, shop_id: shopId },
      include: { product: true },
    });

    if (variants.length !== resolvedItems.length) {
      const found = new Set(variants.map((v) => v.id));
      const missing = variantIds.filter((id) => !found.has(id));
      throw new BadRequestException(`Variants not found: ${missing.join(', ')}`);
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of resolvedItems) {
      const v = variantMap.get(item.variant_id)!;
      if (v.track_inventory && v.stock_qty < item.qty) {
        throw new BadRequestException(`Insufficient stock for ${v.label || v.sku}. Available: ${v.stock_qty}`);
      }
    }

    const subtotal = resolvedItems.reduce((s, item) => s + Number(variantMap.get(item.variant_id)!.price) * item.qty, 0);

    let discountAmount = 0;
    let freeShipping = false;
    if (appliedCoupon) {
      const now = new Date();
      const valid =
        appliedCoupon.is_active &&
        (!appliedCoupon.starts_at || appliedCoupon.starts_at <= now) &&
        (!appliedCoupon.ends_at || appliedCoupon.ends_at >= now) &&
        (appliedCoupon.usage_limit === null || appliedCoupon.used_count < appliedCoupon.usage_limit);

      if (valid) {
        if (appliedCoupon.type === 'percentage') discountAmount = (subtotal * Number(appliedCoupon.value)) / 100;
        else if (appliedCoupon.type === 'fixed') discountAmount = Math.min(Number(appliedCoupon.value), subtotal);
        else if (appliedCoupon.type === 'free_shipping') freeShipping = true;
        if (appliedCoupon.free_shipping) freeShipping = true;
      } else {
        appliedCoupon = null;
      }
    }

    const shippingAmount = freeShipping ? 0 : subtotal >= 500 ? 0 : 50;
    const total = Math.max(0, subtotal - discountAmount + shippingAmount);
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    let registeredCustomer: any = null;
    if (dto.customer_id) {
      try {
        registeredCustomer = await this.tenantPrisma.customer.findFirst({ where: { shop_id: shopId, id: dto.customer_id } });
      } catch { /* non-critical */ }
    } else if (dto.customer_email) {
      try {
        registeredCustomer = await this.tenantPrisma.customer.findFirst({ where: { shop_id: shopId, email: dto.customer_email } });
      } catch { /* non-critical */ }
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          shop_id: shopId,
          customer_id: registeredCustomer?.id || null,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          discount_amount: discountAmount,
          shipping_amount: shippingAmount,
          tax_amount: 0,
          total,
          coupon_id: appliedCoupon?.id || null,
          coupon_code: appliedCoupon?.code || null,
          guest_email: registeredCustomer ? null : (dto.customer_email || null),
          guest_name: registeredCustomer ? null : (dto.customer_name || null),
          guest_phone: registeredCustomer ? null : (dto.customer_phone || null),
          shipping_address: {
            ...(dto.shipping_address || {}),
            full_name: dto.customer_name || dto.shipping_address?.full_name || null,
            email: dto.customer_email || dto.shipping_address?.email || null,
            phone: dto.customer_phone || dto.shipping_address?.phone || null,
          },
          notes: dto.notes || null,
          payment_method: dto.payment_method,
          fulfillment_status: 'unfulfilled',
          refund_status: 'none',
          items: {
            create: resolvedItems.map((item) => {
              const v = variantMap.get(item.variant_id)!;
              return {
                shop_id: shopId,
                variant_id: item.variant_id,
                qty: item.qty,
                unit_price: v.price,
                line_total: Number(v.price) * item.qty,
                product_snap: { name: v.product.name, sku: v.sku, label: v.label, image_url: v.image_url || null },
              };
            }),
          },
        },
        include: { items: true },
      });

      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId, order_id: order.id, from_status: null, to_status: 'pending',
          note: `Order placed via storefront (${dto.payment_method.toUpperCase()})`,
        },
      });

      await tx.orderTracking.create({
        data: { shop_id: shopId, order_id: order.id, status: 'ordered', message: 'Order received and awaiting confirmation' },
      });

      if (dto.payment_method === 'cod') {
        await tx.order.update({ where: { id: order.id }, data: { status: 'confirmed' } });
        await tx.orderStatusLog.create({
          data: { shop_id: shopId, order_id: order.id, from_status: 'pending', to_status: 'confirmed', note: 'Confirmed under Cash on Delivery terms' },
        });
        await tx.orderTracking.create({
          data: { shop_id: shopId, order_id: order.id, status: 'confirmed', message: 'Order confirmed. Preparing for dispatch.' },
        });
        await this.deductInventory(tx, shopId, resolvedItems, variantMap, order.id, orderNumber);
      }

      if (appliedCoupon) {
        await tx.coupon.update({ where: { id: appliedCoupon.id }, data: { used_count: { increment: 1 } } });
        await tx.couponUsage.create({
          data: {
            shop_id: shopId, coupon_id: appliedCoupon.id,
            customer_id: registeredCustomer?.id || null,
            guest_email: registeredCustomer ? null : (dto.customer_email || null),
            order_id: order.id,
          },
        });
      }

      if (registeredCustomer) {
        await this.tenantPrisma.customer.update({
          where: { id: registeredCustomer.id },
          data: { total_orders: { increment: 1 }, total_spent: { increment: total } },
        });
      }

      if (cartId) {
        await tx.cartItem.deleteMany({ where: { cart_id: cartId } });
        await tx.cart.update({ where: { id: cartId }, data: { coupon_id: null } });
      }

      let gatewayOrder: any = null;
      if (dto.payment_method === 'razorpay') {
        gatewayOrder = await this.checkoutService.createRazorpayOrder(shopId, total, 'INR', order.order_number);
      }

      return {
        order: { ...order, status: dto.payment_method === 'cod' ? 'confirmed' : 'pending' },
        paymentRequired: dto.payment_method !== 'cod',
        gatewayOrder,
      };
    });
  }

  async lookupGuestOrder(shopId: string, orderNumber: string, email: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        shop_id: shopId,
        order_number: orderNumber,
        guest_email: { equals: email.trim(), mode: 'insensitive' },
      },
      include: { items: true, tracking: { orderBy: { occurred_at: 'asc' } } },
    });

    if (!order) throw new NotFoundException('Order not found. Check the order number and email.');
    return this.sanitizePublicOrder(order);
  }

  async getPublicOrderById(shopId: string, orderId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const order = await this.prisma.order.findFirst({
      where: isUuid
        ? { OR: [{ id: orderId }, { order_number: orderId }], shop_id: shopId }
        : { order_number: orderId, shop_id: shopId },
      include: { items: true, tracking: { orderBy: { occurred_at: 'asc' } } },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    let customerInfo: any = null;
    if (order.customer_id) {
      try {
        customerInfo = await this.tenantPrisma.customer.findUnique({
          where: { id: order.customer_id },
          select: { id: true, name: true, email: true, phone: true },
        });
      } catch { /* non-critical */ }
    }

    return { ...this.sanitizePublicOrder(order), customer: customerInfo };
  }

  private sanitizePublicOrder(order: any) {
    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      fulfillment_status: order.fulfillment_status,
      refund_status: order.refund_status,
      subtotal: order.subtotal,
      shipping_amount: order.shipping_amount,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      total: order.total,
      coupon_code: order.coupon_code,
      shipping_address: order.shipping_address,
      notes: order.notes,
      payment_method: order.payment_method,
      courier_name: order.courier_name,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      expected_delivery_at: order.expected_delivery_at,
      cancelled_at: order.cancelled_at,
      cancel_reason: order.cancel_reason,
      created_at: order.created_at,
      tracking: order.tracking || [],
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        qty: item.qty,
        unit_price: item.unit_price,
        line_total: item.line_total,
        refunded_qty: item.refunded_qty,
        product_snap: item.product_snap,
      })),
    };
  }

  private async deductInventory(
    tx: any,
    shopId: string,
    items: { variant_id: string; qty: number }[],
    variantMap: Map<string, any>,
    orderId: string,
    orderNumber: string,
  ) {
    const warehouse = await tx.warehouse.findFirst({ where: { shop_id: shopId, is_active: true } });

    for (const item of items) {
      const v = variantMap.get(item.variant_id);
      if (!v || !v.track_inventory) continue;
      const newQty = Math.max(0, v.stock_qty - item.qty);
      await tx.productVariant.update({
        where: { id: item.variant_id },
        data: { stock_qty: newQty, total_sold: { increment: item.qty } },
      });
      if (warehouse) {
        await tx.inventoryLog.create({
          data: {
            shop_id: shopId, variant_id: item.variant_id, warehouse_id: warehouse.id,
            type: 'sale', qty_change: -item.qty, qty_after: newQty,
            ref_id: orderId, note: `Sale deduction: ${orderNumber}`,
          },
        });
      }
    }
  }

  private async resolveOrderItems(shopId: string, items: { variant_id: string; qty: number }[]) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const resolved: { variant_id: string; qty: number }[] = [];

    for (const item of items) {
      let varId = item.variant_id;
      if (!varId) throw new BadRequestException('item.variant_id is required');

      let productId: string | null = null;

      if (varId.startsWith('default-')) {
        productId = varId.replace('default-', '');
      } else if (uuidRegex.test(varId)) {
        const isVariant = await this.prisma.productVariant.count({ where: { id: varId, shop_id: shopId } });
        if (isVariant === 0) {
          const isProduct = await this.prisma.product.count({ where: { id: varId, shop_id: shopId } });
          if (isProduct > 0) productId = varId;
          else throw new BadRequestException(`Item "${varId}" not found in this shop`);
        }
      } else {
        throw new BadRequestException(`Invalid variant reference: "${varId}"`);
      }

      if (productId) {
        let defaultVariant = await this.prisma.productVariant.findFirst({ where: { product_id: productId, shop_id: shopId } });
        if (!defaultVariant) {
          const product = await this.prisma.product.findFirst({ where: { id: productId, shop_id: shopId } });
          if (!product) throw new BadRequestException(`Product ${productId} not found`);
          const sku = product.master_sku?.trim() || `${productId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
          defaultVariant = await this.prisma.productVariant.create({
            data: {
              shop_id: shopId, product_id: productId, label: 'Standard', sku,
              price: product.price, compare_price: product.compare_price, cost_price: product.cost_price,
              stock_qty: 100, is_active: true,
            },
          });
        }
        varId = defaultVariant.id;
      }

      resolved.push({ variant_id: varId, qty: item.qty });
    }

    return resolved;
  }
}
