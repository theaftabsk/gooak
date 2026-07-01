import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

// Section types supported by the storefront renderer:
//   hero          — full-width banner: title, subtitle, bg_image?, button_label?, button_url?
//   rich_text     — markdown/HTML block: title?, html
//   image_text    — side-by-side: title?, text, image_url, image_side ('left'|'right')
//   cards         — icon grid: title?, items[{ icon?, title, text }]
//   cta           — action strip: title, subtitle?, button_label, button_url, bg_color?
//   contact_form  — renders the live contact form widget: title?, subtitle?

const DEFAULT_PAGES: Record<string, { title: string; sections: any[] }> = {
  home: {
    title: 'Home',
    sections: [
      { type: 'announcement_bar', data: { text: '🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500 — 100% Natural Products', active: true } },
      { type: 'banner_slider', data: { banners: [
        { title: 'Discover Our Collection', image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1400', link_url: '/products' },
        { title: 'New Arrivals', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1400', link_url: '/collections/new-arrivals' },
      ] } },
      { type: 'categories_carousel', data: { badge: 'Collections', title: 'Product Categories' } },
      { type: 'products_grid', data: { badge: 'Trending', title: 'Best Sellers', subtitle: 'Deals You Can\'t Miss', limit: 4, view_all_url: '/products', view_all_label: 'VIEW ALL →' } },
      { type: 'products_grid', data: { badge: 'New Arrivals', title: 'Featured Collection', limit: 8, columns: 4, view_all_url: '/products' } },
      { type: 'features_strip', data: {} },
      { type: 'about_section', data: { title: 'About Us', content: 'We are a natural beauty and health company. Our products are chemical-free, handcrafted following traditional methods and formulations.', tagline: '"Live Healthy. Stay Beautiful."' } },
      { type: 'cta', data: { title: 'Start your wellness journey today', subtitle: 'Join thousands of happy customers who have transformed their routine with our premium organic products.', button_label: 'Shop All Products', button_url: '/products', button2_label: 'Our Story', button2_url: '/about' } },
    ],
  },
  about: {
    title: 'About Us',
    sections: [
      {
        type: 'hero',
        data: {
          title: 'About Us',
          subtitle: 'Skincare rooted in science, crafted with care.',
        },
      },
      {
        type: 'image_text',
        data: {
          image_side: 'right',
          image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800',
          title: 'Our Story',
          text: 'We started with a simple belief — that effective skincare should not cost a fortune. Every formula in our range is clinically backed, free of harmful fillers, and designed to actually work. We research obsessively so you do not have to.',
        },
      },
      {
        type: 'cards',
        data: {
          title: 'Our Values',
          items: [
            { icon: '🔬', title: 'Science-First', text: 'Every ingredient is chosen for proven efficacy, not trend.' },
            { icon: '💚', title: 'Clean & Honest', text: 'No hidden nasties. Full transparency on every label.' },
            { icon: '🌱', title: 'Sustainable', text: 'Responsible sourcing and recyclable packaging.' },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          title: 'Ready to start your skin journey?',
          button_label: 'Shop All Products',
          button_url: '/products',
        },
      },
    ],
  },

  contact: {
    title: 'Contact Us',
    sections: [
      {
        type: 'hero',
        data: {
          title: 'Contact Us',
          subtitle: 'We typically respond to all queries within 24 hours.',
        },
      },
      {
        type: 'contact_form',
        data: {
          title: 'Send us a message',
          subtitle: 'Fill out the form below and our team will get back to you shortly.',
        },
      },
      {
        type: 'cards',
        data: {
          title: 'Other Ways to Reach Us',
          items: [
            { icon: '📧', title: 'Email', text: 'support@yourstore.com' },
            { icon: '📞', title: 'Phone', text: '+91 98765 43210\nMon–Fri, 9 AM – 6 PM IST' },
            { icon: '📍', title: 'Location', text: 'Bengaluru, Karnataka, India' },
          ],
        },
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        type: 'hero',
        data: {
          title: 'Privacy Policy',
          subtitle: 'Your privacy matters. Here is how we handle your data.',
        },
      },
      {
        type: 'rich_text',
        data: {
          html: `<h3>What we collect</h3><p>When you place an order, we collect your name, email address, shipping address, and payment information necessary to fulfil your purchase.</p><h3>How we use it</h3><p>We use your information to process orders, send shipping updates, and provide customer support. We do not use it for unrelated marketing without your consent.</p><h3>What we do not do</h3><p>We never sell or rent your personal data to third parties. Information is shared only as required to fulfil your order (e.g., with our shipping carrier).</p><h3>Data security</h3><p>All transactions are encrypted using SSL/TLS technology. We follow industry-standard practices to protect your information.</p><h3>Contact</h3><p>For any privacy-related questions, please reach out via our <a href="/contact">contact page</a>.</p>`,
        },
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    sections: [
      {
        type: 'hero',
        data: {
          title: 'Terms & Conditions',
          subtitle: 'Please read these terms carefully before using our store.',
        },
      },
      {
        type: 'rich_text',
        data: {
          html: `<h3>Acceptance</h3><p>By accessing this website, you agree to be bound by these terms of service and all applicable laws and regulations.</p><h3>Products</h3><p>All product descriptions are accurate to the best of our knowledge. Colours may vary slightly from on-screen representations due to monitor settings.</p><h3>Pricing</h3><p>All prices are in Indian Rupees (INR) and include applicable GST. Prices may change without prior notice.</p><h3>Orders</h3><p>Once an order is confirmed, it cannot be modified. Cancellations may be possible within 2 hours of placing the order by contacting our support team.</p><h3>Intellectual Property</h3><p>All content on this site — including text, images, and branding — is the property of our store and may not be reproduced without explicit written permission.</p>`,
        },
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    sections: [
      {
        type: 'hero',
        data: {
          title: 'Refund & Returns',
          subtitle: 'Not happy? We make it right.',
        },
      },
      {
        type: 'cards',
        data: {
          title: 'At a Glance',
          items: [
            { icon: '📦', title: '14-Day Returns', text: 'Return unopened items within 14 days of delivery.' },
            { icon: '✅', title: 'Easy Process', text: 'Email us with your order number and reason. We handle the rest.' },
            { icon: '💳', title: 'Fast Refunds', text: 'Approved refunds reach your account within 5–7 business days.' },
          ],
        },
      },
      {
        type: 'rich_text',
        data: {
          html: `<h3>Eligibility</h3><p>Items may be returned within 14 days of delivery provided they are <strong>unopened</strong>, in their original packaging, and with all seals intact.</p><h3>Non-returnable items</h3><p>Opened skincare products cannot be returned for hygiene and safety reasons, unless the product is demonstrably defective or incorrectly sent.</p><h3>Defective or wrong items</h3><p>If you receive a damaged, defective, or wrong item, contact us within <strong>48 hours</strong> of delivery with clear photos. We will arrange a free replacement or a full refund.</p><h3>How to start a return</h3><p>Email <strong>returns@yourstore.com</strong> with your order number, item(s) to return, and reason. Our team will respond within one business day with return instructions.</p>`,
        },
      },
    ],
  },
};

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async getPageBySlug(shopId: string, slug: string) {
    const page = await this.prisma.page.findFirst({ where: { shop_id: shopId, slug, status: 'published' } });
    if (page) return page;

    const fallback = DEFAULT_PAGES[slug];
    if (!fallback) throw new NotFoundException(`Page '${slug}' not found`);

    return this.prisma.page.create({
      data: { shop_id: shopId, slug, title: fallback.title, sections: fallback.sections, status: 'published' },
    });
  }

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
