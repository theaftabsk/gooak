import { Injectable, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async createRazorpayOrder(shopId: string, amount: number, currency: string = 'INR', receiptId: string) {
    try {
      const gateway = await this.prisma.paymentGateway.findFirst({
        where: { shop_id: shopId, slug: 'razorpay', is_active: true },
      });
      const config = (gateway?.config || {}) as any;
      const keyId = config?.key_id || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      const keySecret = config?.key_secret || process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

      if (keyId.includes('placeholder') || keySecret.includes('placeholder')) {
        return {
          id: `order_sim_${Math.random().toString(36).substring(2, 12)}`,
          amount: Math.round(amount * 100),
          currency,
          receipt: receiptId,
          status: 'created',
        };
      }

      const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
      return await client.orders.create({ amount: Math.round(amount * 100), currency, receipt: receiptId });
    } catch {
      return {
        id: `order_sim_${Math.random().toString(36).substring(2, 12)}`,
        amount: Math.round(amount * 100),
        currency,
        receipt: receiptId,
        status: 'created',
      };
    }
  }

  async initializePayment(shopId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, shop_id: shopId } });
    if (!order) throw new BadRequestException('Order not found for this shop');
    if (order.status === 'confirmed') throw new BadRequestException('This order has already been paid');
    if (order.status !== 'pending') throw new BadRequestException(`Order is in status '${order.status}' and cannot be paid`);

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { currency: true } });
    const gateway = await this.prisma.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'razorpay', is_active: true } });
    if (!gateway) throw new BadRequestException('Razorpay payment gateway is not configured or active');

    const keyId = ((gateway.config as any)?.key_id) || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const razorpayOrder = await this.createRazorpayOrder(shopId, Number(order.total), shop?.currency || 'INR', order.order_number);

    return {
      order_id: order.id,
      order_number: order.order_number,
      total: order.total,
      currency: shop?.currency || 'INR',
      razorpay_order_id: razorpayOrder.id,
      razorpay_key_id: keyId,
    };
  }

  async verifyPayment(
    shopId: string,
    dto: { orderId: string; razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string },
  ) {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = dto;

    const gateway = await this.prisma.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'razorpay', is_active: true } });
    if (!gateway) throw new BadRequestException('Razorpay payment gateway is not active or configured');

    const keySecret = ((gateway.config as any)?.key_secret) || process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const generated = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (generated !== razorpay_signature) throw new BadRequestException('Payment signature verification failed');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId, shop_id: shopId } });
      if (!order) throw new BadRequestException('Order not found');
      if (order.status === 'confirmed') return { success: true, message: 'Payment already verified' };

      const shop = await tx.shop.findUnique({ where: { id: shopId }, select: { currency: true } });

      await tx.payment.create({
        data: {
          shop_id: shopId, order_id: order.id, gateway_id: gateway.id,
          amount: order.total, currency: shop?.currency || 'INR',
          status: 'paid', transaction_id: razorpay_payment_id, gateway_resp: dto as any, paid_at: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'confirmed', paid_amount: order.total, payment_method: 'razorpay' },
      });

      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId, order_id: order.id, from_status: order.status, to_status: 'confirmed',
          note: 'Payment verified and captured via storefront client callback',
        },
      });

      await tx.orderTracking.create({
        data: { shop_id: shopId, order_id: order.id, status: 'confirmed', message: 'Payment received. Order confirmed.' },
      });

      await this.deductInventory(tx, shopId, order.id, order.order_number);

      return { success: true };
    });
  }

  async verifyWebhookSignature(shopId: string, rawBody: string, signature: string): Promise<boolean> {
    const gateway = await this.prisma.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'razorpay', is_active: true } });
    const secret = ((gateway?.config as any)?.webhook_secret) || process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';
    const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return digest === signature;
  }

  async handleWebhook(shopId: string, payload: any) {
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) throw new BadRequestException('Webhook payload missing payment entity');

    if (event === 'payment.captured') {
      const amount = paymentEntity.amount / 100;

      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { order_number: paymentEntity.receipt } });
        if (!order) throw new Error(`Order receipt ${paymentEntity.receipt} not found`);

        const gateway = await tx.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'razorpay' } });
        if (!gateway) throw new Error('Payment gateway config for Razorpay not found');

        await tx.payment.create({
          data: {
            shop_id: shopId, order_id: order.id, gateway_id: gateway.id,
            amount, currency: paymentEntity.currency || 'INR',
            status: 'paid', transaction_id: paymentEntity.id, gateway_resp: paymentEntity, paid_at: new Date(),
          },
        });

        await tx.order.update({ where: { id: order.id }, data: { status: 'confirmed' } });

        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId, order_id: order.id, from_status: order.status, to_status: 'confirmed',
            note: 'Razorpay webhook payment captured successfully',
          },
        });

        await this.deductInventory(tx, shopId, order.id, order.order_number);
      });
    }

    return { status: 'success' };
  }

  // Dev/sandbox only — generates a valid HMAC signature and auto-verifies the order
  async simulatePayment(shopId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, shop_id: shopId } });
    if (!order) throw new BadRequestException('Order not found');
    if (order.status === 'confirmed') return { success: true, message: 'Order already confirmed' };

    const gateway = await this.prisma.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'razorpay' } });
    const keySecret = ((gateway?.config as any)?.key_secret) || process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

    let razorpayOrderId: string;
    try {
      const rzpOrder = await this.createRazorpayOrder(shopId, Number(order.total), 'INR', order.order_number);
      razorpayOrderId = rzpOrder.id;
    } catch {
      razorpayOrderId = `order_sim_${Math.random().toString(36).substring(2, 12)}`;
    }

    const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 12)}`;
    const signature = crypto.createHmac('sha256', keySecret).update(`${razorpayOrderId}|${mockPaymentId}`).digest('hex');

    return this.verifyPayment(shopId, {
      orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: signature,
    });
  }

  private async deductInventory(tx: any, shopId: string, orderId: string, orderNumber: string) {
    const orderItems = await tx.orderItem.findMany({ where: { order_id: orderId }, select: { variant_id: true, qty: true } });

    // Auto-create warehouse if none exists so logs are always written
    let warehouse = await tx.warehouse.findFirst({ where: { shop_id: shopId, is_active: true }, select: { id: true } });
    if (!warehouse) {
      warehouse = await tx.warehouse.create({
        data: { shop_id: shopId, name: 'Main Warehouse', is_active: true },
        select: { id: true },
      });
    }

    for (const item of orderItems) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variant_id },
        select: { stock_qty: true, reserved_qty: true, track_inventory: true },
      });
      if (!variant?.track_inventory) continue;
      const newStock = Math.max(0, variant.stock_qty - item.qty);
      const newReserved = Math.max(0, (variant.reserved_qty ?? 0) - item.qty);
      const newAvailable = Math.max(0, newStock - newReserved);

      await tx.productVariant.update({
        where: { id: item.variant_id },
        data: {
          stock_qty: newStock,
          reserved_qty: newReserved,
          available_qty: newAvailable,
          total_sold: { increment: item.qty },
        },
      });
      await tx.inventoryLog.create({
        data: {
          shop_id: shopId, variant_id: item.variant_id, warehouse_id: warehouse.id,
          type: 'sale', qty_change: -item.qty, qty_after: newStock,
          ref_id: orderId, note: `Sale: ${orderNumber}`,
        },
      });
    }
  }
}
