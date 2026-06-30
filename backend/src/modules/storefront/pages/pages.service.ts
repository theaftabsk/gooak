import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async getPageContent(shopId: string) {
    const [settings, shop] = await Promise.all([
      this.prisma.setting.findMany({ where: { shop_id: shopId, group: 'pages' } }),
      this.prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, logo_url: true, description: true } }),
    ]);
    const content: Record<string, string> = {};
    for (const s of settings) content[s.key] = s.value;
    return { shop, content };
  }

  async submitContactForm(shopId: string, dto: { name: string; email: string; subject?: string; message: string }) {
    await this.prisma.activityLog.create({
      data: {
        shop_id: shopId,
        action: 'contact_form_submission',
        entity_type: 'contact',
        metadata: { name: dto.name, email: dto.email, subject: dto.subject || '', message: dto.message, submitted_at: new Date().toISOString() },
      },
    });
    return { success: true, message: 'Thank you! Your message has been received.' };
  }

  async createTenantRequest(dto: { name: string; slug: string; ownerName: string; ownerEmail: string; phone?: string; category?: string }) {
    const existingShop = await this.prisma.shop.findUnique({ where: { slug: dto.slug } });
    if (existingShop) throw new BadRequestException('Shop slug is already registered');

    const existingReq = await this.prisma.tenantRequest.findUnique({ where: { slug: dto.slug } });
    if (existingReq) throw new BadRequestException('Shop slug is already requested');

    return this.prisma.tenantRequest.create({
      data: {
        name: dto.name, slug: dto.slug, owner_name: dto.ownerName, owner_email: dto.ownerEmail,
        phone: dto.phone || null, category: dto.category || null, status: 'pending',
      },
    });
  }
}
