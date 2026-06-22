import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

  async customerRegister(
    shopId: string,
    dto: {
      name: string;
      email: string;
      phone?: string;
      password: string;
    },
  ) {
    const bcrypt = await import('bcryptjs');

    // Check if email is already taken in this shop's isolated customer base
    const existing = await this.tenantPrisma.customer.findFirst({
      where: {
        shop_id: shopId,
        email: {
          equals: dto.email.trim(),
          mode: 'insensitive',
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'An account with this email already exists.',
      );
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    const customer = await this.tenantPrisma.customer.create({
      data: {
        shop_id: shopId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        password_hash,
        is_verified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar_url: true,
        created_at: true,
      },
    });

    const secret =
      process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    const token = jwt.sign({ customerId: customer.id, shopId }, secret, {
      expiresIn: '30d',
    });

    return { customer, token };
  }

  async customerLogin(
    shopId: string,
    dto: { email: string; password: string },
  ) {
    const bcrypt = await import('bcryptjs');
    const customer = await this.tenantPrisma.customer.findFirst({
      where: {
        shop_id: shopId,
        email: {
          equals: dto.email.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!customer) {
      throw new BadRequestException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(dto.password, customer.password_hash || '');
    if (!valid) {
      throw new BadRequestException('Invalid email or password.');
    }

    const secret =
      process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    const token = jwt.sign({ customerId: customer.id, shopId }, secret, {
      expiresIn: '30d',
    });

    const { password_hash, ...customerData } = customer;
    return { customer: customerData, token };
  }

  async getCustomerMe(shopId: string, customerId: string) {
    const customer = await this.tenantPrisma.customer.findFirst({
      where: { id: customerId, shop_id: shopId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar_url: true,
        total_orders: true,
        total_spent: true,
        created_at: true,
        addresses: { orderBy: { is_default: 'desc' } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found.');
    return customer;
  }

  async updateCustomerMe(
    shopId: string,
    customerId: string,
    dto: {
      name?: string;
      phone?: string;
      avatar_url?: string;
      current_password?: string;
      new_password?: string;
    },
  ) {
    const bcrypt = await import('bcryptjs');
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url;

    if (dto.new_password) {
      if (!dto.current_password) {
        throw new BadRequestException(
          'Current password is required to set a new password.',
        );
      }
      const customer = await this.tenantPrisma.customer.findUnique({
        where: { id: customerId },
      });
      const valid = await bcrypt.compare(
        dto.current_password,
        customer?.password_hash || '',
      );
      if (!valid)
        throw new BadRequestException('Current password is incorrect.');
      data.password_hash = await bcrypt.hash(dto.new_password, 10);
    }

    const updated = await this.tenantPrisma.customer.update({
      where: { id: customerId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar_url: true,
        created_at: true,
      },
    });
    return updated;
  }

  async getCustomerOrders(shopId: string, customerId: string) {
    // Orders remain in central shared database
    const orders = await this.prisma.order.findMany({
      where: { shop_id: shopId, customer_id: customerId },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
      },
    });
    return orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
      items: o.items,
    }));
  }

  async verifyCustomerToken(
    token: string,
  ): Promise<{ customerId: string; shopId: string }> {
    const secret =
      process.env.CUSTOMER_JWT_SECRET || 'customer_secret_oaksol_2026';
    try {
      const payload = jwt.verify(token, secret) as any;
      return { customerId: payload.customerId, shopId: payload.shopId };
    } catch {
      throw new UnauthorizedException('Invalid or expired customer token.');
    }
  }
}

// Add class mapping
import { UnauthorizedException } from '@nestjs/common';
