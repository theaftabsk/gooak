import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { tenantPrismaClient } from '../../database/tenant-context';
import { TEMPLATES } from './templates';

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async platformAdminLogin(dto: { email: string; password: string }) {
    const admin = await this.prisma.platformAdmin.findFirst({
      where: {
        email: {
          equals: dto.email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        permissions: true,
        status: true,
      },
    });

    if (!admin || admin.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(dto.password, admin.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const secret =
      process.env.JWT_SECRET ||
      'oaksol-commerce-jwt-secret-key-replace-in-production';
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions,
        role: 'super_admin',
      },
      secret,
      { expiresIn: '7d' },
    );

    return {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions,
        status: admin.status,
      },
    };
  }

  // Get dashboard stats for Super Admin overview
  async getDashboardStats() {
    const [totalShops, totalRequests, pendingRequests, totalProducts] =
      await Promise.all([
        this.prisma.shop.count({ where: { status: 'active' } }),
        this.prisma.tenantRequest.count(),
        this.prisma.tenantRequest.count({ where: { status: 'pending' } }),
        this.prisma.product.count(),
      ]);
    return { totalShops, totalRequests, pendingRequests, totalProducts };
  }

  // 6. Platform Tenant Registration (Get Demo Shop)
  async registerShop(dto: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerName: string;
    ownerPassword?: string;
    industry?: string;
    theme?: string;
  }) {
    const password = dto.ownerPassword || `${dto.slug}@OakSol2026`;
    const bcrypt = await import('bcryptjs');
    const ownerHash = await bcrypt.hash(password, 10);

    const industryKey = (dto.industry || 'fashion').toLowerCase();
    const themeKey = (dto.theme || 'classic').toLowerCase();

    const selectedIndustry = TEMPLATES[industryKey] || TEMPLATES.fashion;
    const selectedTemplate = selectedIndustry[themeKey] || Object.values(selectedIndustry)[0];

    const themeColors = {
      primaryColor: selectedTemplate.theme.primaryColor,
      secondaryColor: selectedTemplate.theme.secondaryColor,
      backgroundColor: selectedTemplate.theme.backgroundColor,
      fontFamily: selectedTemplate.theme.fontFamily || 'Inter, sans-serif'
    };

    // 1. Create shop
    const shop = await this.prisma.shop.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: 'starter',
        status: 'active',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal =
      platformDomain === 'localhost' || platformDomain.includes('localhost');
    const storeDomain = isLocal
      ? `${dto.slug}.localhost`
      : `${dto.slug}.${platformDomain}`;

    // 2. Create dynamic domain mapping
    await this.prisma.shopDomain.create({
      data: {
        shop_id: shop.id,
        domain: storeDomain,
        type: 'subdomain',
        is_primary: true,
        status: 'active',
        verified_at: new Date(),
      },
    });

    // 3. Create shop owner user
    const owner = await this.prisma.user.create({
      data: {
        shop_id: shop.id,
        name: dto.ownerName,
        email: dto.ownerEmail,
        password_hash: ownerHash,
        password: password,
        role: 'owner',
      },
    });

    // Link shop owner
    await this.prisma.shop.update({
      where: { id: shop.id },
      data: { owner_id: owner.id },
    });

    // 4. Seed basic shop settings in settings table
    const defaultSettings = [
      { shop_id: shop.id, key: 'store_name', value: dto.name, group: 'general' },
      { shop_id: shop.id, key: 'store_email', value: dto.ownerEmail, group: 'general' },
      { shop_id: shop.id, key: 'store_currency', value: 'INR', group: 'general' },
      { shop_id: shop.id, key: 'store_timezone', value: 'Asia/Kolkata', group: 'general' },
      { shop_id: shop.id, key: 'store_status', value: 'active', group: 'general' },

      // Seeding header/footer layout options from selected template
      { shop_id: shop.id, key: 'announcement_bar', value: selectedTemplate.settings.announcement_bar || 'Welcome to our store!', group: 'pages' },
      { shop_id: shop.id, key: 'announcement_bar_active', value: selectedTemplate.settings.announcement_bar_active || 'true', group: 'pages' },
      { shop_id: shop.id, key: 'logo_url', value: '', group: 'pages' },
      { shop_id: shop.id, key: 'navbar_menu', value: JSON.stringify([
        { title: 'Home', url: '/' },
        { title: 'Products', url: '/products' },
        { title: 'Categories', url: '/categories' },
        { title: 'Collections', url: '/collections' },
        { title: 'About Us', url: '/about' },
        { title: 'Contact Us', url: '/contact' }
      ]), group: 'pages' },
      { shop_id: shop.id, key: 'footer_menu', value: JSON.stringify([
        { title: 'Privacy Policy', url: '/privacy' },
        { title: 'Terms & Conditions', url: '/terms' },
        { title: 'Refund Policy', url: '/refund' },
        { title: 'Track Order', url: '/track-order' }
      ]), group: 'pages' },

      // About page settings
      { shop_id: shop.id, key: 'about_title', value: selectedTemplate.settings.about_title || 'About Our Brand', group: 'pages' },
      { shop_id: shop.id, key: 'about_tagline', value: selectedTemplate.settings.about_tagline || 'Crafted with passion', group: 'pages' },
      { shop_id: shop.id, key: 'about_content', value: selectedTemplate.settings.about_content || `Welcome to ${dto.name}. We provide high-quality items for all our customers.`, group: 'pages' },

      // Default contact settings
      { shop_id: shop.id, key: 'show_contact_email', value: 'true', group: 'pages' },
      { shop_id: shop.id, key: 'contact_email', value: dto.ownerEmail, group: 'pages' },
      { shop_id: shop.id, key: 'contact_email_desc', value: 'We reply to emails within 24 hours.', group: 'pages' },
      { shop_id: shop.id, key: 'show_contact_phone', value: 'true', group: 'pages' },
      { shop_id: shop.id, key: 'contact_phone', value: '+91 98765 43210', group: 'pages' },
      { shop_id: shop.id, key: 'contact_phone_desc', value: 'Available Mon-Fri, 9am - 6pm.', group: 'pages' },

      // Default policy pages content
      { shop_id: shop.id, key: 'privacy_updated', value: 'June 2026', group: 'pages' },
      { shop_id: shop.id, key: 'privacy_content', value: 'Your privacy is extremely important to us. We do not sell or share your personal information with third parties except as necessary to fulfill orders or comply with legal requests.', group: 'pages' },
      { shop_id: shop.id, key: 'terms_updated', value: 'June 2026', group: 'pages' },
      { shop_id: shop.id, key: 'terms_content', value: 'By accessing and purchasing from our storefront, you agree to comply with and be bound by our terms and conditions. All contents are property of our store.', group: 'pages' },
      { shop_id: shop.id, key: 'refund_updated', value: 'June 2026', group: 'pages' },
      { shop_id: shop.id, key: 'refund_content', value: 'We accept returns within 14 days of purchase. Items must be in original condition with tags attached. Refunds will be credited to the original payment method.', group: 'pages' },
    ];

    await this.prisma.setting.createMany({
      data: defaultSettings,
    });

    // 4b. Seed default CMS pages with structured sections (Shopify-style widgets).
    const shopSlug = dto.slug.toLowerCase().replace(/\s/g, '');
    await this.prisma.page.createMany({
      data: [
        {
          shop_id: shop.id, title: 'Home', slug: 'home', status: 'published',
          sections: [
            { type: 'announcement_bar', data: { text: `🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500 — Welcome to ${dto.name}!`, active: true } },
            { type: 'banner_slider', data: { banners: [
              { title: `Welcome to ${dto.name}`, image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1400', link_url: '/products' },
              { title: 'New Arrivals', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1400', link_url: '/collections/new-arrivals' },
            ] } },
            { type: 'categories_carousel', data: { badge: 'Collections', title: 'Product Categories' } },
            { type: 'products_grid', data: { badge: 'Trending', title: 'Best Sellers', subtitle: "Deals You Can't Miss", limit: 4, view_all_url: '/products', view_all_label: 'VIEW ALL →' } },
            { type: 'products_grid', data: { badge: 'New Arrivals', title: 'Featured Collection', limit: 8, columns: 4, view_all_url: '/products' } },
            { type: 'features_strip', data: {} },
            { type: 'about_section', data: { title: `About ${dto.name}`, content: `${dto.name} was founded with a simple belief — effective products should not cost a fortune. Every item in our range is carefully curated and designed to actually work.`, tagline: '"Quality you can trust."' } },
            { type: 'cta', data: { title: 'Start your journey today', subtitle: 'Join thousands of happy customers.', button_label: 'Shop All Products', button_url: '/products', button2_label: 'Our Story', button2_url: '/about' } },
          ],
        },
        {
          shop_id: shop.id, title: 'About Us', slug: 'about', status: 'published',
          sections: [
            { type: 'hero', data: { title: 'About Us', subtitle: 'Skincare rooted in science, crafted with care.' } },
            { type: 'image_text', data: { image_side: 'right', image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800', title: 'Our Story', text: `${dto.name} was founded with a simple belief — effective skincare should not cost a fortune. Every formula is clinically backed and designed to actually work.` } },
            { type: 'cards', data: { title: 'Our Values', items: [{ icon: '🔬', title: 'Science-First', text: 'Every ingredient is chosen for proven efficacy.' }, { icon: '💚', title: 'Clean & Honest', text: 'Full transparency on every label.' }, { icon: '🌱', title: 'Sustainable', text: 'Responsible sourcing and recyclable packaging.' }] } },
            { type: 'cta', data: { title: 'Ready to start your skin journey?', button_label: 'Shop All Products', button_url: '/products' } },
          ],
        },
        {
          shop_id: shop.id, title: 'Contact Us', slug: 'contact', status: 'published',
          sections: [
            { type: 'hero', data: { title: 'Contact Us', subtitle: 'We typically respond to all queries within 24 hours.' } },
            { type: 'contact_form', data: { title: 'Send us a message', subtitle: 'Fill out the form and our team will get back to you shortly.' } },
            { type: 'cards', data: { title: 'Other Ways to Reach Us', items: [{ icon: '📧', title: 'Email', text: `support@${shopSlug}.com` }, { icon: '📞', title: 'Phone', text: '+91 98765 43210\nMon–Fri, 9 AM – 6 PM IST' }] } },
          ],
        },
        {
          shop_id: shop.id, title: 'Privacy Policy', slug: 'privacy', status: 'published',
          sections: [
            { type: 'hero', data: { title: 'Privacy Policy', subtitle: 'Your privacy matters. Here is how we handle your data.' } },
            { type: 'rich_text', data: { html: '<h3>What we collect</h3><p>When you place an order we collect your name, email, shipping address, and payment information.</p><h3>How we use it</h3><p>To process orders, send shipping updates, and provide customer support.</p><h3>What we do not do</h3><p>We never sell or rent your personal data to third parties.</p><h3>Security</h3><p>All transactions are encrypted using SSL/TLS technology.</p>' } },
          ],
        },
        {
          shop_id: shop.id, title: 'Terms & Conditions', slug: 'terms', status: 'published',
          sections: [
            { type: 'hero', data: { title: 'Terms & Conditions', subtitle: 'Please read these terms carefully before using our store.' } },
            { type: 'rich_text', data: { html: '<h3>Acceptance</h3><p>By accessing this website you agree to be bound by these terms of service.</p><h3>Products</h3><p>All product descriptions are accurate to the best of our knowledge.</p><h3>Pricing</h3><p>All prices are in Indian Rupees (INR) and include applicable GST.</p><h3>Orders</h3><p>Once confirmed, orders cannot be modified. Cancellations possible within 2 hours.</p>' } },
          ],
        },
        {
          shop_id: shop.id, title: 'Refund Policy', slug: 'refund', status: 'published',
          sections: [
            { type: 'hero', data: { title: 'Refund & Returns', subtitle: 'Not happy? We make it right.' } },
            { type: 'cards', data: { title: 'At a Glance', items: [{ icon: '📦', title: '14-Day Returns', text: 'Return unopened items within 14 days of delivery.' }, { icon: '✅', title: 'Easy Process', text: 'Email us with your order number. We handle the rest.' }, { icon: '💳', title: 'Fast Refunds', text: 'Approved refunds arrive within 5–7 business days.' }] } },
            { type: 'rich_text', data: { html: '<h3>Eligibility</h3><p>Items must be unopened and in original packaging with seals intact.</p><h3>Non-returnable items</h3><p>Opened skincare products cannot be returned for hygiene reasons unless defective.</p><h3>Defective items</h3><p>Contact us within <strong>48 hours</strong> of delivery with photos for a free replacement or full refund.</p>' } },
          ],
        },
      ],
    });

    // 4c. Seed default collections so the storefront has browsable groupings immediately
    await this.prisma.collection.createMany({
      data: [
        { shop_id: shop.id, name: 'New Arrivals', slug: 'new-arrivals', description: 'Freshly added to the store', is_active: true },
        { shop_id: shop.id, name: 'Best Sellers', slug: 'best-sellers', description: 'Customer favorites', is_active: true },
        { shop_id: shop.id, name: 'Featured Products', slug: 'featured-products', description: 'Highlighted picks of the month', is_active: true },
      ],
    });

    // 5. Seed default payment gateways
    await this.prisma.paymentGateway.createMany({
      data: [
        { shop_id: shop.id, name: 'Cash on Delivery', slug: 'cod', is_active: true, sort_order: 1 },
        { shop_id: shop.id, name: 'Razorpay', slug: 'razorpay', is_active: false, sort_order: 2, config: { key_id: '', key_secret: '' } },
      ],
    });

    // 6. Seed default warehouse
    await this.prisma.warehouse.create({
      data: {
        shop_id: shop.id,
        name: 'Main Warehouse',
        is_active: true,
      },
    });

    // 7. Seed default categories, products, variants
    const defaultCategory = await this.prisma.category.create({
      data: {
        shop_id: shop.id,
        name: 'New Arrivals',
        slug: 'new-arrivals',
        is_active: true,
      },
    });

    const defaultProduct = await this.prisma.product.create({
      data: {
        shop_id: shop.id,
        category_id: defaultCategory.id,
        name: 'Sample Product',
        slug: 'sample-product',
        short_desc: `This is a sample product for your ${dto.name} storefront.`,
        description: `This is a sample product created automatically to help you get started with your new ${dto.name} store.`,
        price: 99.00,
        compare_price: 129.00,
        status: 'active',
        is_featured: true,
        has_variants: true,
      },
    });

    await this.prisma.productVariant.create({
      data: {
        shop_id: shop.id,
        product_id: defaultProduct.id,
        sku: `SAMPLE-${dto.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        label: 'Default Variant',
        price: 99.00,
        stock_qty: 100,
        is_active: true,
      },
    });

    // Seed default homepage section
    await this.prisma.productSection.create({
      data: {
        shop_id: shop.id,
        title: 'Featured Collections',
        type: 'grid',
        is_active: true,
        sort_order: 1,
        config: { limit: 4 },
      },
    });



    // 9. Seed default demo customer for the new shop
    try {
      const customerHash = await bcrypt.hash('Customer@123', 10);
      await tenantPrismaClient.customer.create({
        data: {
          shop_id: shop.id,
          name: 'Demo Customer',
          email: `customer@${dto.slug}.localhost`,
          password_hash: customerHash,
          is_verified: true,
        },
      });
    } catch (err) {
      console.error(`Seeding default customer failed for ${shop.slug}:`, err);
    }

    // 10. Assign Free plan subscription
    try {
      let freePlan = await this.prisma.subscriptionPlan.findUnique({ where: { slug: 'free' } });
      if (!freePlan) {
        freePlan = await this.prisma.subscriptionPlan.create({
          data: {
            name: 'Free',
            slug: 'free',
            price: 0,
            interval: 'monthly',
            max_products: 50,
            max_orders: 100,
            features: ['50 products', '100 orders/month', 'Basic analytics'],
            is_active: true,
            sort_order: 0,
          },
        });
      }
      await this.prisma.shopSubscription.create({
        data: { shop_id: shop.id, plan_id: freePlan.id, status: 'active' },
      });
    } catch (err) {
      console.error(`Assigning free plan failed for ${shop.slug}:`, err);
    }

    return {
      shopId: shop.id,
      shopSlug: shop.slug,
      domain: storeDomain,
      ownerEmail: dto.ownerEmail,
      ownerPassword: password,
    };
  }

  // Get all provisioned shops with their domains and owners
  async getShops() {
    const shops = await this.prisma.shop.findMany({
      include: {
        domains: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return shops.map((shop) => ({
      ...shop,
      domains: this.formatShopDomains(shop.domains, shop.slug),
    }));
  }

  // Get dynamic details of a single shop
  async getShopDetail(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const shop = await this.prisma.shop.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        domains: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            password_hash: true,
            role: true,
            is_active: true,
          },
        },
        products: {
          include: {
            category: { select: { name: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        categories: {
          orderBy: { sort_order: 'asc' },
        },
        banners: {
          orderBy: { sort_order: 'asc' },
        },
        product_sections: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop details not found');
    }

    return {
      ...shop,
      domains: this.formatShopDomains(shop.domains, shop.slug),
    };
  }

  // Update shop metadata (Super Admin)
  async updateShop(
    id: string,
    dto: {
      name?: string;
      plan?: string;
      status?: string;
      description?: string;
    },
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.plan && { plan: dto.plan }),
        ...(dto.status && { status: dto.status }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // Delete a shop and all its data (Super Admin)
  async deleteShop(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    await this.prisma.shop.delete({ where: { id } });
    return {
      message: `Shop "${shop.name}" (${shop.slug}) deleted successfully`,
    };
  }

  // Get all tenant requests
  async getTenantRequests() {
    return this.prisma.tenantRequest.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Approve a tenant request
  async approveTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Tenant request not found');
    }
    if (request.status === 'approved') {
      throw new BadRequestException('Tenant request already approved');
    }

    // Generate a secure password for the new merchant
    const generatedPassword = `${request.slug}@OakSol2026`;

    // Map request category to industry / theme
    let industry = 'fashion';
    let theme = 'classic';

    if (request.category) {
      const cat = request.category.toLowerCase();
      if (cat.includes('clothing') || cat.includes('fashion')) {
        industry = 'fashion';
        theme = 'classic';
      } else if (cat.includes('electronics')) {
        industry = 'electronics';
        theme = 'modern';
      } else if (cat.includes('food') || cat.includes('beverage') || cat.includes('restaurant')) {
        industry = 'restaurant';
        theme = 'cafe';
      } else if (cat.includes('living') || cat.includes('furniture')) {
        industry = 'furniture';
        theme = 'minimalist';
      } else if (cat.includes('wellness') || cat.includes('supplement') || cat.includes('pharmacy')) {
        industry = 'pharmacy';
        theme = 'wellness';
      } else if (cat.includes('skincare') || cat.includes('haircare') || cat.includes('beauty')) {
        industry = 'beauty';
        theme = 'organic';
      } else if (cat.includes('grocery') || cat.includes('market') || cat.includes('fruit')) {
        industry = 'grocery';
        theme = 'fresh';
      } else if (cat.includes('pet')) {
        industry = 'petstore';
        theme = 'playful';
      }
    }

    // Register the shop using the existing registerShop logic
    const result = await this.registerShop({
      name: request.name,
      slug: request.slug,
      ownerEmail: request.owner_email,
      ownerName: request.owner_name,
      ownerPassword: generatedPassword,
      industry,
      theme,
    });

    // Update status to approved
    await this.prisma.tenantRequest.update({
      where: { id },
      data: { status: 'approved' },
    });

    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal =
      platformDomain === 'localhost' || platformDomain.includes('localhost');
    const scheme = isLocal ? 'http' : 'https';
    const portSuffix = isLocal ? ':3000' : '';

    return {
      message: 'Shop successfully provisioned',
      ...result,
      credentials: {
        email: request.owner_email,
        password: generatedPassword,
        loginUrl: `${scheme}://${request.slug}.${platformDomain}${portSuffix}/admin`,
        domain: `${scheme}://${request.slug}.${platformDomain}${portSuffix}`,
      },
    };
  }

  // Reject a tenant request (Super Admin)
  async rejectTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Tenant request not found');
    return this.prisma.tenantRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });
  }

  // Delete a tenant request (Super Admin)
  async deleteTenantRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Tenant request not found');
    await this.prisma.tenantRequest.delete({ where: { id } });
    return { message: 'Tenant request deleted successfully' };
  }

  async getPlatformAdmin(id: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true,
      },
    });
    if (!admin) throw new NotFoundException('Administrator not found.');
    return admin;
  }

  async getPlatformTeam() {
    return this.prisma.platformAdmin.findMany({
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true,
      },
    });
  }

  async createPlatformAdmin(dto: {
    name: string;
    email: string;
    password?: string;
    permissions?: string[];
  }) {
    const existing = await this.prisma.platformAdmin.findFirst({
      where: {
        email: {
          equals: dto.email,
          mode: 'insensitive',
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Administrator with this email already exists.',
      );
    }

    const password = dto.password || 'OaksolAdmin2026';
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    return this.prisma.platformAdmin.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash: hash,
        permissions: dto.permissions || [],
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true,
      },
    });
  }

  async updatePlatformAdmin(
    id: string,
    dto: { status?: string; permissions?: string[] },
  ) {
    const targetAdmin = await this.prisma.platformAdmin.findUnique({
      where: { id },
    });
    if (!targetAdmin) {
      throw new NotFoundException('Administrator not found.');
    }

    // Protect Master Admin from downgrade/status change by others
    if (targetAdmin.email === 'admin@oaksol.in') {
      throw new BadRequestException('Cannot modify the primary owner.');
    }

    const updatedData: any = {};
    if (dto.status !== undefined) {
      updatedData.status = dto.status;
    }
    if (dto.permissions !== undefined) {
      updatedData.permissions = dto.permissions;
    }

    return this.prisma.platformAdmin.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
        created_at: true,
      },
    });
  }

  async deletePlatformAdmin(id: string) {
    const targetAdmin = await this.prisma.platformAdmin.findUnique({
      where: { id },
    });
    if (!targetAdmin) {
      throw new NotFoundException('Administrator not found.');
    }

    if (targetAdmin.email === 'admin@oaksol.in') {
      throw new BadRequestException('Cannot delete the primary owner.');
    }

    await this.prisma.platformAdmin.delete({
      where: { id },
    });

    return { success: true };
  }

  private formatShopDomains(domains: any[], slug: string) {
    const platformDomain = process.env.PLATFORM_DOMAIN || 'posix.digital';
    const isLocal =
      platformDomain === 'localhost' || platformDomain.includes('localhost');
    const storeSuffix = isLocal ? 'localhost' : platformDomain;

    return domains.map((d) => {
      if (d.type === 'subdomain') {
        return {
          ...d,
          domain: `${slug}.${storeSuffix}`,
        };
      }
      return d;
    });
  }

  // ─── Subscription Plans ───────────────────────────────────────────────────

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { level: 'asc' },
      include: { plan_addons: { include: { addon: true } } },
    });
  }

  async createPlan(dto: {
    name: string;
    slug: string;
    level: number;
    is_free?: boolean;
    price: number;
    interval?: string;
    max_products?: number;
    max_orders?: number;
    features?: string[];
    sort_order?: number;
  }) {
    return this.prisma.subscriptionPlan.create({
      data: { ...dto, is_free: dto.is_free ?? dto.price === 0 },
    });
  }

  async updatePlan(id: string, dto: {
    name?: string;
    level?: number;
    is_free?: boolean;
    price?: number;
    interval?: string;
    max_products?: number;
    max_orders?: number;
    features?: string[];
    is_active?: boolean;
    sort_order?: number;
  }) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async deletePlan(id: string) {
    const inUse = await this.prisma.shopSubscription.count({ where: { plan_id: id } });
    if (inUse > 0) throw new BadRequestException('Plan is assigned to shops and cannot be deleted.');
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { success: true };
  }

  // ─── Add-ons ──────────────────────────────────────────────────────────────

  async getAddons() {
    return this.prisma.subscriptionAddon.findMany({ orderBy: { name: 'asc' } });
  }

  async createAddon(dto: {
    name: string; slug: string; description?: string; price: number; interval?: string;
  }) {
    return this.prisma.subscriptionAddon.create({ data: dto });
  }

  async updateAddon(id: string, dto: {
    name?: string; description?: string; price?: number; interval?: string; is_active?: boolean;
  }) {
    return this.prisma.subscriptionAddon.update({ where: { id }, data: dto });
  }

  async deleteAddon(id: string) {
    await this.prisma.subscriptionAddon.delete({ where: { id } });
    return { success: true };
  }

  // ─── Promo Codes ──────────────────────────────────────────────────────────

  async getPromoCodes() {
    return this.prisma.promoCode.findMany({ orderBy: { created_at: 'desc' } });
  }

  async createPromoCode(dto: {
    code: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    applicable_plans?: string[];
    max_uses?: number;
    starts_at?: string;
    expires_at?: string;
  }) {
    return this.prisma.promoCode.create({
      data: {
        ...dto,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      },
    });
  }

  async updatePromoCode(id: string, dto: {
    description?: string; discount_value?: number; max_uses?: number;
    expires_at?: string; is_active?: boolean;
  }) {
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...dto,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
      },
    });
  }

  async deletePromoCode(id: string) {
    const inUse = await this.prisma.shopSubscription.count({ where: { promo_code_id: id } });
    if (inUse > 0) throw new BadRequestException('Promo code is in use and cannot be deleted.');
    await this.prisma.promoCode.delete({ where: { id } });
    return { success: true };
  }

  async validatePromoCode(code: string, planSlug: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.is_active) throw new NotFoundException('Invalid promo code.');
    if (promo.expires_at && promo.expires_at < new Date()) throw new BadRequestException('Promo code has expired.');
    if (promo.starts_at && promo.starts_at > new Date()) throw new BadRequestException('Promo code is not yet active.');
    if (promo.max_uses && promo.used_count >= promo.max_uses) throw new BadRequestException('Promo code usage limit reached.');
    if (promo.applicable_plans.length > 0 && !promo.applicable_plans.includes(planSlug)) {
      throw new BadRequestException(`Promo code is not valid for the '${planSlug}' plan.`);
    }
    return promo;
  }

  // ─── Shop Subscription Management ────────────────────────────────────────

  private readonly SUBSCRIPTION_INCLUDE = {
    plan: { include: { plan_addons: { include: { addon: true } } } },
    promo_code: true,
    addons: { include: { addon: true } },
    payments: { orderBy: { created_at: 'desc' as const }, take: 10 },
  };

  async getShopSubscription(shopId: string) {
    return this.prisma.shopSubscription.findUnique({
      where: { shop_id: shopId },
      include: this.SUBSCRIPTION_INCLUDE,
    });
  }

  async getAllSubscriptions(filters?: { status?: string; plan_id?: string }) {
    return this.prisma.shopSubscription.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.plan_id && { plan_id: filters.plan_id }),
      },
      include: {
        plan: true,
        shop: { select: { id: true, name: true, slug: true } },
        promo_code: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async assignSubscription(shopId: string, dto: {
    plan_id: string;
    status?: string;
    is_trial?: boolean;
    trial_ends_at?: string;
    current_period_start?: string;
    current_period_end?: string;
    next_payment_at?: string;
    promo_code?: string;
    payment_status?: string;
  }) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.plan_id } });
    if (!plan) throw new NotFoundException('Subscription plan not found.');

    let promoCodeId: string | null = null;
    let discountAmount = 0;

    if (dto.promo_code) {
      const promo = await this.validatePromoCode(dto.promo_code, plan.slug);
      promoCodeId = promo.id;
      discountAmount = promo.discount_type === 'percent'
        ? Number(plan.price) * Number(promo.discount_value) / 100
        : Number(promo.discount_value);
    }

    const data = {
      plan_id: dto.plan_id,
      status: dto.status || (plan.is_free ? 'active' : 'active'),
      is_trial: dto.is_trial ?? false,
      trial_ends_at: dto.trial_ends_at ? new Date(dto.trial_ends_at) : null,
      current_period_start: dto.current_period_start ? new Date(dto.current_period_start) : new Date(),
      current_period_end: dto.current_period_end ? new Date(dto.current_period_end) : null,
      next_payment_at: dto.next_payment_at ? new Date(dto.next_payment_at) : null,
      payment_status: dto.payment_status ?? (plan.is_free ? 'not_required' : 'unpaid'),
      promo_code_id: promoCodeId,
      discount_amount: discountAmount,
      cancelled_at: null,
      cancel_reason: null,
    };

    const subscription = await this.prisma.shopSubscription.upsert({
      where: { shop_id: shopId },
      create: { shop_id: shopId, ...data },
      update: data,
      include: this.SUBSCRIPTION_INCLUDE,
    });

    if (promoCodeId) {
      await this.prisma.promoCode.update({
        where: { id: promoCodeId },
        data: { used_count: { increment: 1 } },
      });
    }

    return subscription;
  }

  async cancelSubscription(shopId: string, dto?: { reason?: string }) {
    return this.prisma.shopSubscription.update({
      where: { shop_id: shopId },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancel_reason: dto?.reason || null,
      },
      include: this.SUBSCRIPTION_INCLUDE,
    });
  }

  async addAddonToSubscription(shopId: string, addonId: string, quantity = 1) {
    const subscription = await this.prisma.shopSubscription.findUnique({ where: { shop_id: shopId } });
    if (!subscription) throw new NotFoundException('Subscription not found.');
    return this.prisma.shopSubscriptionAddon.upsert({
      where: { subscription_id_addon_id: { subscription_id: subscription.id, addon_id: addonId } },
      create: { subscription_id: subscription.id, addon_id: addonId, quantity },
      update: { quantity },
      include: { addon: true },
    });
  }

  async removeAddonFromSubscription(shopId: string, addonId: string) {
    const subscription = await this.prisma.shopSubscription.findUnique({ where: { shop_id: shopId } });
    if (!subscription) throw new NotFoundException('Subscription not found.');
    await this.prisma.shopSubscriptionAddon.delete({
      where: { subscription_id_addon_id: { subscription_id: subscription.id, addon_id: addonId } },
    });
    return { success: true };
  }

  async recordSubscriptionPayment(shopId: string, dto: {
    amount: number;
    currency?: string;
    status: string;
    gateway?: string;
    transaction_id?: string;
    invoice_url?: string;
    promo_code?: string;
    discount?: number;
    paid_at?: string;
    failed_at?: string;
    failure_reason?: string;
  }) {
    const subscription = await this.prisma.shopSubscription.findUnique({ where: { shop_id: shopId } });
    if (!subscription) throw new NotFoundException('Subscription not found.');

    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        subscription_id: subscription.id,
        amount: dto.amount,
        currency: dto.currency || 'USD',
        status: dto.status,
        gateway: dto.gateway || null,
        transaction_id: dto.transaction_id || null,
        invoice_url: dto.invoice_url || null,
        promo_code: dto.promo_code || null,
        discount: dto.discount || 0,
        paid_at: dto.paid_at ? new Date(dto.paid_at) : (dto.status === 'paid' ? new Date() : null),
        failed_at: dto.failed_at ? new Date(dto.failed_at) : (dto.status === 'failed' ? new Date() : null),
        failure_reason: dto.failure_reason || null,
      },
    });

    // Update subscription payment status to reflect the latest payment outcome
    await this.prisma.shopSubscription.update({
      where: { id: subscription.id },
      data: {
        payment_status: dto.status,
        last_payment_at: dto.status === 'paid' ? new Date() : subscription.last_payment_at,
        last_payment_failed_at: dto.status === 'failed' ? new Date() : subscription.last_payment_failed_at,
        payment_failure_reason: dto.status === 'failed' ? (dto.failure_reason || null) : null,
        status: dto.status === 'paid' ? 'active' : dto.status === 'failed' ? 'past_due' : subscription.status,
      },
    });

    return payment;
  }

  async getSubscriptionPayments(shopId: string) {
    const subscription = await this.prisma.shopSubscription.findUnique({ where: { shop_id: shopId } });
    if (!subscription) throw new NotFoundException('Subscription not found.');
    return this.prisma.subscriptionPayment.findMany({
      where: { subscription_id: subscription.id },
      orderBy: { created_at: 'desc' },
    });
  }
}
