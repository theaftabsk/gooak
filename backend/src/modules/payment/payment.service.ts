import { Injectable, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  // Create an order on Razorpay servers using dynamic credentials
  async createRazorpayOrder(shopId: string, amount: number, currency: string = 'INR', receiptId: string) {
    try {
      const gateway = await this.prisma.paymentGateway.findFirst({
        where: { shop_id: shopId, slug: 'razorpay', is_active: true }
      });

      const config = (gateway?.config || {}) as any;
      const keyId = config?.key_id || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      const keySecret = config?.key_secret || process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

      const client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paisa (1 INR = 100 Paisa)
        currency,
        receipt: receiptId,
      };

      const order = await client.orders.create(options);
      return order;
    } catch (error) {
      throw new BadRequestException(`Razorpay order creation failed: ${error.message}`);
    }
  }

  // Verify signature of incoming Webhook payload dynamically
  async verifyWebhookSignature(shopId: string, payload: string, signature: string): Promise<boolean> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { shop_id: shopId, slug: 'razorpay', is_active: true }
    });
    const config = (gateway?.config || {}) as any;
    const secret = config?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';
    
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(payload);
    const digest = shasum.digest('hex');

    return digest === signature;
  }

  // Process payment webhook callbacks
  async handleWebhook(shopId: string, payload: any) {
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
      throw new BadRequestException('Webhook payload missing payment entity');
    }

    if (event === 'payment.captured') {
      const transactionId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // Convert back from paisa

      // Run database transaction to record payment and update order
      await this.prisma.$transaction(async (tx) => {
        // Find order linked to this payment
        const order = await tx.order.findUnique({
          where: { order_number: paymentEntity.receipt },
        });

        if (!order) {
          throw new Error(`Order receipt ${paymentEntity.receipt} not found`);
        }

        // Record payment transaction
        const gateway = await tx.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'razorpay' } });
        if (!gateway) {
          throw new Error('Payment gateway config for Razorpay not found');
        }

        await tx.payment.create({
          data: {
            shop_id: shopId,
            order_id: order.id,
            gateway_id: gateway.id,
            amount,
            currency: paymentEntity.currency || 'INR',
            status: 'paid',
            transaction_id: transactionId,
            gateway_resp: paymentEntity,
            paid_at: new Date(),
          },
        });

        // Update order status to confirmed
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' },
        });

        // Add status log
        await tx.orderStatusLog.create({
          data: {
            shop_id: shopId,
            order_id: order.id,
            from_status: order.status,
            to_status: 'confirmed',
            note: 'Razorpay webhook payment captured successfully',
          },
        });

        // Create inventory log deductions for each item in the order
        const orderItems = await tx.orderItem.findMany({
          where: { order_id: order.id },
          select: { variant_id: true, qty: true },
        });

        for (const item of orderItems) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variant_id },
            select: { stock_qty: true },
          });

          const warehouse = await tx.warehouse.findFirst({
            where: { shop_id: shopId, is_active: true },
            select: { id: true },
          });

          if (variant && warehouse) {
            const newStock = Math.max(0, variant.stock_qty - item.qty);
            
            // Update variant stock qty
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: { stock_qty: newStock },
            });

            // Create inventory log
            await tx.inventoryLog.create({
              data: {
                shop_id: shopId,
                variant_id: item.variant_id,
                warehouse_id: warehouse.id,
                type: 'sale',
                qty_change: -item.qty,
                qty_after: newStock,
                ref_id: order.id,
                note: `Order sale deduction: ${order.order_number}`,
              },
            });
          }
        }
      });
    }

    return { status: 'success' };
  }

  // Verify client-side signature and record payment immediately
  async verifyPayment(
    shopId: string,
    dto: {
      orderId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  ) {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = dto;

    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { shop_id: shopId, slug: 'razorpay', is_active: true }
    });
    if (!gateway) {
      throw new BadRequestException('Razorpay payment gateway is not active or configured');
    }

    const config = gateway.config as any;
    const keySecret = config?.key_secret || process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    // Run database transaction to record payment and update order
    return this.prisma.$transaction(async (tx) => {
      // Find order
      const order = await tx.order.findUnique({
        where: { id: orderId, shop_id: shopId },
      });

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      if (order.status === 'confirmed') {
        return { success: true, message: 'Payment already verified' };
      }

      // Find shop to get currency code
      const shop = await tx.shop.findUnique({
        where: { id: shopId },
        select: { currency: true }
      });

      // Record payment transaction
      await tx.payment.create({
        data: {
          shop_id: shopId,
          order_id: order.id,
          gateway_id: gateway.id,
          amount: order.total,
          currency: shop?.currency || 'INR',
          status: 'paid',
          transaction_id: razorpay_payment_id,
          gateway_resp: dto as any,
          paid_at: new Date(),
        },
      });

      // Update order status to confirmed
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'confirmed' },
      });

      // Add status log
      await tx.orderStatusLog.create({
        data: {
          shop_id: shopId,
          order_id: order.id,
          from_status: order.status,
          to_status: 'confirmed',
          note: 'Payment verified and captured via storefront client callback',
        },
      });

      // Create inventory log deductions for each item in the order
      const orderItems = await tx.orderItem.findMany({
        where: { order_id: order.id },
        select: { variant_id: true, qty: true },
      });

      for (const item of orderItems) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variant_id },
          select: { stock_qty: true },
        });

        const warehouse = await tx.warehouse.findFirst({
          where: { shop_id: shopId, is_active: true },
          select: { id: true },
        });

        if (variant && warehouse) {
          const newStock = Math.max(0, variant.stock_qty - item.qty);
          
          // Update variant stock qty
          await tx.productVariant.update({
            where: { id: item.variant_id },
            data: { stock_qty: newStock },
          });

          // Create inventory log
          await tx.inventoryLog.create({
            data: {
              shop_id: shopId,
              variant_id: item.variant_id,
              warehouse_id: warehouse.id,
              type: 'sale',
              qty_change: -item.qty,
              qty_after: newStock,
              ref_id: order.id,
              note: `Order sale deduction: ${order.order_number}`,
            },
          });
        }
      }

      return { success: true };
    });
  }

  // Initialize a Razorpay payment for an existing pending order (used by dedicated payment page)
  async initializePayment(shopId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shop_id: shopId },
    });

    if (!order) {
      throw new BadRequestException('Order not found for this shop');
    }

    if (order.status === 'confirmed') {
      throw new BadRequestException('This order has already been paid');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException(`Order is in status '${order.status}' and cannot be paid`);
    }

    // Get shop currency
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { currency: true },
    });

    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { shop_id: shopId, slug: 'razorpay', is_active: true },
    });

    if (!gateway) {
      throw new BadRequestException('Razorpay payment gateway is not configured or active');
    }

    const config = (gateway.config || {}) as any;
    const keyId = config?.key_id || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';

    const razorpayOrder = await this.createRazorpayOrder(
      shopId,
      Number(order.total),
      shop?.currency || 'INR',
      order.order_number,
    );

    return {
      order_id: order.id,
      order_number: order.order_number,
      total: order.total,
      currency: shop?.currency || 'INR',
      razorpay_order_id: razorpayOrder.id,
      razorpay_key_id: keyId,
    };
  }

  // Get gateways list, auto-seeding default ones if none exist
  async getPaymentGateways(shopId: string, isAdmin: boolean) {
    let gateways = await this.prisma.paymentGateway.findMany({
      where: { shop_id: shopId },
      orderBy: { sort_order: 'asc' },
    });

    if (gateways.length === 0) {
      await this.prisma.paymentGateway.createMany({
        data: [
          {
            shop_id: shopId,
            name: 'Cash on Delivery',
            slug: 'cod',
            is_active: true,
            sort_order: 1,
            config: {},
          },
          {
            shop_id: shopId,
            name: 'Razorpay Online Payment',
            slug: 'razorpay',
            is_active: true,
            sort_order: 2,
            config: {
              key_id: 'rzp_test_placeholder_key_id',
              key_secret: 'placeholder_secret',
            },
          },
        ],
      });

      gateways = await this.prisma.paymentGateway.findMany({
        where: { shop_id: shopId },
        orderBy: { sort_order: 'asc' },
      });
    }

    if (!isAdmin) {
      return gateways.map((g) => {
        const conf = (g.config || {}) as any;
        const publicConfig = { ...conf };
        delete publicConfig.key_secret;
        return {
          ...g,
          config: publicConfig,
        };
      });
    }

    return gateways;
  }

  // Update gateway settings
  async updatePaymentGateway(
    shopId: string,
    id: string,
    dto: { name?: string; is_active?: boolean; config?: any; sort_order?: number }
  ) {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id, shop_id: shopId },
    });

    if (!gateway) {
      throw new BadRequestException('Payment gateway not found');
    }

    const existingConfig = (gateway.config || {}) as any;
    const mergedConfig = dto.config ? { ...existingConfig, ...dto.config } : existingConfig;

    return this.prisma.paymentGateway.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.config !== undefined && { config: mergedConfig }),
        ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
      },
    });
  }
}
