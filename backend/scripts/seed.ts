import { config } from 'dotenv';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/central';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();

  const defaultAdminEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@oaksol.in';
  const defaultAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? '1234';

  const existingAdmin = await prisma.platformAdmin.findUnique({
    where: { email: defaultAdminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);
    await prisma.platformAdmin.create({
      data: {
        name: 'Master Admin',
        email: defaultAdminEmail,
        password_hash: passwordHash,
        is_owner: true,
        permissions: ['SEED_DEMO'],
        status: 'active',
      },
    });
    console.log(`Created default platform admin: ${defaultAdminEmail}`);
    console.log(`Use password: ${defaultAdminPassword}`);
  } else {
    console.log(`Platform admin already exists: ${defaultAdminEmail}`);
  }

  const sampleShopSlug = process.env.DEV_SAMPLE_SHOP_SLUG ?? 'testShop';
  const sampleShopEmail = process.env.DEV_SAMPLE_SHOP_EMAIL ?? `owner@${sampleShopSlug}.localhost`;
  const sampleShopPassword = process.env.DEV_SAMPLE_SHOP_PASSWORD ?? 'ShopOwner@123';

  const existingShop = await prisma.shop.findUnique({ where: { slug: sampleShopSlug } });
  if (!existingShop) {
    const sampleShop = await prisma.shop.create({
      data: {
        name: 'Test Shop',
        slug: sampleShopSlug,
        plan: 'starter',
        status: 'active',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    await prisma.shopDomain.create({
      data: {
        shop_id: sampleShop.id,
        domain: `${sampleShopSlug}.localhost`,
        type: 'subdomain',
        is_primary: true,
        status: 'active',
        verified_at: new Date(),
      },
    });

    const ownerHash = await bcrypt.hash(sampleShopPassword, 10);
    const owner = await prisma.user.create({
      data: {
        shop_id: sampleShop.id,
        name: 'Demo Shop Owner',
        email: sampleShopEmail,
        password_hash: ownerHash,
        password: sampleShopPassword,
        role: 'owner',
      },
    });

    await prisma.shop.update({
      where: { id: sampleShop.id },
      data: { owner_id: owner.id },
    });

    // Seed settings
    await prisma.setting.createMany({
      data: [
        { shop_id: sampleShop.id, key: 'store_name', value: 'Test Shop', group: 'general' },
        { shop_id: sampleShop.id, key: 'store_email', value: sampleShopEmail, group: 'general' },
        { shop_id: sampleShop.id, key: 'store_currency', value: 'INR', group: 'general' },
        { shop_id: sampleShop.id, key: 'store_timezone', value: 'Asia/Kolkata', group: 'general' },
        { shop_id: sampleShop.id, key: 'store_status', value: 'active', group: 'general' },
      ],
    });

    // Seed payment gateways
    await prisma.paymentGateway.createMany({
      data: [
        { shop_id: sampleShop.id, name: 'Cash on Delivery', slug: 'cod', is_active: true, sort_order: 1 },
        { shop_id: sampleShop.id, name: 'Razorpay', slug: 'razorpay', is_active: false, sort_order: 2, config: { key_id: '', key_secret: '' } },
      ],
    });

    // Seed warehouse
    await prisma.warehouse.create({
      data: {
        shop_id: sampleShop.id,
        name: 'Main Warehouse',
        is_active: true,
      },
    });

    // Seed categories, products, variants
    const cat = await prisma.category.create({
      data: {
        shop_id: sampleShop.id,
        name: 'New Arrivals',
        slug: 'new-arrivals',
        is_active: true,
      },
    });

    const prod = await prisma.product.create({
      data: {
        shop_id: sampleShop.id,
        category_id: cat.id,
        name: 'Sample Product',
        slug: 'sample-product',
        short_desc: 'This is a sample product created automatically.',
        description: 'This is a sample product created automatically to help you get started with your new storefront.',
        price: 99.00,
        compare_price: 129.00,
        status: 'active',
        is_featured: true,
        has_variants: true,
      },
    });

    await prisma.productVariant.create({
      data: {
        shop_id: sampleShop.id,
        product_id: prod.id,
        sku: `SAMPLE-${sampleShopSlug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        label: 'Default Variant',
        price: 99.00,
        stock_qty: 100,
        is_active: true,
      },
    });

    // Seed default homepage section
    await prisma.productSection.create({
      data: {
        shop_id: sampleShop.id,
        title: 'Featured Collections',
        type: 'grid',
        is_active: true,
        sort_order: 1,
        config: { limit: 4 },
      },
    });

    // Seed default pages with theme palettes
    const pagesToSeed = [
      { title: 'Home Page', slug: 'index', content: 'Welcome to our store. We provide high-quality formulations.' },
      { title: 'About Us', slug: 'about', content: 'Welcome to our store. We provide high-quality formulations.' },
      { title: 'Contact Us', slug: 'contact', content: 'Get in touch with us at contact@oaksol.in' },
      { title: 'FAQ', slug: 'faq', content: 'Frequently Asked Questions about our store.' },
      { title: 'Blog', slug: 'blog', content: 'Read our latest insights and articles.' },
      { title: 'Privacy Policy', slug: 'privacy', content: 'Your data safety is our highest priority.' },
      { title: 'Terms & Conditions', slug: 'terms', content: 'Standard terms of service apply to all users.' },
      { title: 'Refund Policy', slug: 'refund', content: 'Check our return and refund policies.' },
      { title: 'Shipping Policy', slug: 'shipping', content: 'Fast and reliable shipping across India.' }
    ];

    for (const pageInfo of pagesToSeed) {
      await prisma.page.create({
        data: {
          shop_id: sampleShop.id,
          title: pageInfo.title,
          slug: pageInfo.slug,
          content: pageInfo.content,
          status: 'published',
        },
      });
    }

    console.log(`Created sample shop: ${sampleShop.slug}`);
    console.log(`Sample owner: ${sampleShopEmail}`);
    console.log(`Sample owner password: ${sampleShopPassword}`);
  } else {
    console.log(`Sample shop already exists: ${existingShop.slug}`);
  }

  // Seed platform-wide System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'global_theme' },
    update: {},
    create: {
      key: 'global_theme',
      value: 'dark',
      description: 'Default platform theme setting',
      is_public: true,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'platform_maintenance' },
    update: {},
    create: {
      key: 'platform_maintenance',
      value: 'false',
      description: 'Maintenance mode status flag',
      is_public: true,
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
