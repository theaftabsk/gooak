import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GatewayService {
  constructor(private prisma: PrismaService) {}

  async getPaymentGateways(shopId: string, isAdmin: boolean) {
    let gateways = await this.prisma.paymentGateway.findMany({
      where: { shop_id: shopId },
      orderBy: { sort_order: 'asc' },
    });

    if (gateways.length === 0) {
      await this.prisma.paymentGateway.createMany({
        data: [
          { shop_id: shopId, name: 'Cash on Delivery', slug: 'cod', is_active: true, sort_order: 1, config: {} },
          {
            shop_id: shopId,
            name: 'Razorpay Online Payment',
            slug: 'razorpay',
            is_active: false,
            sort_order: 2,
            config: { key_id: '', key_secret: '' },
          },
          {
            shop_id: shopId,
            name: 'PhonePe Online Payment',
            slug: 'phonepe',
            is_active: false,
            sort_order: 3,
            config: { merchant_id: '', salt_key: '', salt_index: '1', environment: 'PRODUCTION' },
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
        const conf = { ...(g.config as any) };
        delete conf.key_secret;
        delete conf.salt_key;
        return { ...g, config: conf };
      });
    }

    return gateways;
  }

  async updatePaymentGateway(
    shopId: string,
    id: string,
    dto: { name?: string; is_active?: boolean; config?: any; sort_order?: number },
  ) {
    const gateway = await this.prisma.paymentGateway.findFirst({ where: { id, shop_id: shopId } });
    if (!gateway) throw new BadRequestException('Payment gateway not found');

    const mergedConfig = dto.config ? { ...(gateway.config as any), ...dto.config } : gateway.config;
    const finalActive = dto.is_active !== undefined ? dto.is_active : gateway.is_active;

    if (finalActive) {
      if (gateway.slug === 'razorpay') {
        const keyId = mergedConfig?.key_id || '';
        const secret = mergedConfig?.key_secret || '';
        if (!keyId || !secret || keyId.includes('placeholder') || secret.includes('placeholder')) {
          throw new BadRequestException('Cannot activate Razorpay: key_id and key_secret are required.');
        }
      } else if (gateway.slug === 'phonepe') {
        const merchantId = mergedConfig?.merchant_id || '';
        const saltKey = mergedConfig?.salt_key || '';
        const saltIndex = mergedConfig?.salt_index || '';
        if (!merchantId || !saltKey || !saltIndex) {
          throw new BadRequestException('Cannot activate PhonePe: merchant_id, salt_key, and salt_index are required.');
        }
      }
    }

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
