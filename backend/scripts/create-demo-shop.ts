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
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.$connect();

  const slug = 'demo';
  const shopName = 'demo';
  const ownerEmail = 'demo@gmail.com';
  const ownerPassword = '123';

  console.log(`Checking if shop with slug "${slug}" already exists...`);
  const existingShop = await prisma.shop.findUnique({ where: { slug } });
  if (existingShop) {
    console.log(`Shop with slug "${slug}" already exists. Skipping creation.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`Creating shop "${shopName}"...`);
  const shop = await prisma.shop.create({
    data: {
      name: shopName,
      slug: slug,
      plan: 'starter',
      status: 'active',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });

  console.log(`Creating domain mapping for "${slug}"...`);
  const platformDomain = process.env.PLATFORM_DOMAIN || 'gooak.shop';
  const isLocal = platformDomain === 'localhost' || platformDomain.includes('localhost');
  const storeDomain = isLocal ? `${slug}.localhost` : `${slug}.${platformDomain}`;

  await prisma.shopDomain.create({
    data: {
      shop_id: shop.id,
      domain: storeDomain,
      type: 'subdomain',
      is_primary: true,
      status: 'active',
      verified_at: new Date(),
    },
  });

  console.log(`Creating owner user "${ownerEmail}"...`);
  const ownerHash = await bcrypt.hash(ownerPassword, 10);
  const owner = await prisma.user.create({
    data: {
      shop_id: shop.id,
      name: 'Demo Owner',
      email: ownerEmail,
      password_hash: ownerHash,
      password: ownerPassword,
      role: 'owner',
    },
  });

  await prisma.shop.update({
    where: { id: shop.id },
    data: { owner_id: owner.id },
  });

  console.log(`Seeding settings...`);
  await prisma.setting.createMany({
    data: [
      { shop_id: shop.id, key: 'store_name', value: shopName, group: 'general' },
      { shop_id: shop.id, key: 'store_email', value: ownerEmail, group: 'general' },
      { shop_id: shop.id, key: 'store_currency', value: 'INR', group: 'general' },
      { shop_id: shop.id, key: 'store_timezone', value: 'Asia/Kolkata', group: 'general' },
      { shop_id: shop.id, key: 'store_status', value: 'active', group: 'general' },
    ],
  });

  console.log(`Seeding payment gateways...`);
  await prisma.paymentGateway.createMany({
    data: [
      { shop_id: shop.id, name: 'Cash on Delivery', slug: 'cod', is_active: true, sort_order: 1 },
      { shop_id: shop.id, name: 'Razorpay', slug: 'razorpay', is_active: false, sort_order: 2, config: { key_id: '', key_secret: '' } },
      { shop_id: shop.id, name: 'PhonePe', slug: 'phonepe', is_active: false, sort_order: 3, config: { merchant_id: '', salt_key: '', salt_index: '1' } },
    ],
  });

  console.log(`Seeding warehouse...`);
  await prisma.warehouse.create({
    data: {
      shop_id: shop.id,
      name: 'Main Warehouse',
      is_active: true,
    },
  });

  console.log(`Demo shop successfully created!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Failed to create demo shop:', err);
  process.exit(1);
});
