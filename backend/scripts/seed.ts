import { config } from 'dotenv';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/central';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  const defaultAdminEmail = process.env.PLATFORM_ADMIN_EMAIL ?? 'admin@oak-commerce.local';
  const defaultAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? 'Admin@1234';

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

  const sampleShopSlug = process.env.DEV_SAMPLE_SHOP_SLUG ?? 'demo-shop';
  const sampleShopEmail = process.env.DEV_SAMPLE_SHOP_EMAIL ?? `owner@${sampleShopSlug}.localhost`;
  const sampleShopPassword = process.env.DEV_SAMPLE_SHOP_PASSWORD ?? 'ShopOwner@123';

  const existingShop = await prisma.shop.findUnique({ where: { slug: sampleShopSlug } });
  if (!existingShop) {
    const sampleShop = await prisma.shop.create({
      data: {
        name: 'Demo Shop',
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

    console.log(`Created sample shop: ${sampleShop.slug}`);
    console.log(`Sample owner: ${sampleShopEmail}`);
    console.log(`Sample owner password: ${sampleShopPassword}`);
  } else {
    console.log(`Sample shop already exists: ${existingShop.slug}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
