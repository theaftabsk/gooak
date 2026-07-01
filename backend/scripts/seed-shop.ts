/**
 * Seed demo data for an existing shop.
 *
 * Usage:
 *   pnpm run seed:shop -- --slug=testShop
 *   pnpm run seed:shop -- --id=<uuid>
 *
 * Seeds:
 *   - CMS pages (about, contact, privacy, terms, refund)
 *   - Collections (new-arrivals, best-sellers, featured-products)
 *   - Demo categories
 *   - Demo products with variants and gallery images
 *   - Demo banner
 *   - Default payment gateways (COD enabled)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '../src/generated/central';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ── CLI arg parsing ──────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? 'true'];
    })
);

const SHOP_SLUG = args.slug || null;
const SHOP_ID   = args.id   || null;

if (!SHOP_SLUG && !SHOP_ID) {
  console.error('Usage: pnpm run seed:shop -- --slug=testShop  (or --id=<uuid>)');
  process.exit(1);
}

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_CATEGORIES = [
  { name: 'Serums', slug: 'serums' },
  { name: 'Moisturisers', slug: 'moisturisers' },
  { name: 'Cleansers', slug: 'cleansers' },
  { name: 'Sunscreen', slug: 'sunscreen' },
];

const DEMO_PRODUCTS = [
  {
    name: 'Niacinamide 10% Serum',
    slug: 'niacinamide-10-serum',
    short_desc: 'Controls oil, minimises pores and brightens skin tone.',
    description: 'Our clinically-backed Niacinamide 10% formula is designed to target enlarged pores, uneven skin tone, and excess sebum production. Suitable for all skin types.',
    price: 699,
    compare_price: 999,
    status: 'published',
    is_featured: true,
    categorySlug: 'serums',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800',
    variants: [
      { label: '30ml', price: 699, stock_qty: 50, sku: 'NIAC-30ML' },
      { label: '60ml', price: 1199, stock_qty: 30, sku: 'NIAC-60ML' },
    ],
    collections: ['new-arrivals', 'best-sellers'],
  },
  {
    name: 'Hyaluronic Acid Moisturiser',
    slug: 'hyaluronic-acid-moisturiser',
    short_desc: 'Deep hydration with multi-molecular hyaluronic acid.',
    description: 'Lightweight, non-greasy daily moisturiser with three molecular weights of hyaluronic acid that penetrate different skin layers for 72-hour hydration.',
    price: 849,
    compare_price: 1200,
    status: 'published',
    is_featured: true,
    categorySlug: 'moisturisers',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800',
    variants: [
      { label: '50ml', price: 849, stock_qty: 40, sku: 'HYAL-50ML' },
    ],
    collections: ['best-sellers', 'featured-products'],
  },
  {
    name: 'Gentle Foam Cleanser',
    slug: 'gentle-foam-cleanser',
    short_desc: 'pH-balanced cleanser that removes impurities without stripping.',
    description: 'Formulated with amino acid surfactants, this cleanser maintains your skin barrier while thoroughly removing makeup, dirt, and excess oil.',
    price: 549,
    compare_price: 750,
    status: 'published',
    is_featured: false,
    categorySlug: 'cleansers',
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=800',
    variants: [
      { label: '100ml', price: 549, stock_qty: 60, sku: 'FOAM-100ML' },
      { label: '200ml', price: 899, stock_qty: 25, sku: 'FOAM-200ML' },
    ],
    collections: ['new-arrivals'],
  },
  {
    name: 'SPF 50+ PA++++ Sunscreen',
    slug: 'spf-50-sunscreen',
    short_desc: 'Broad-spectrum UV protection with zero white cast.',
    description: 'Lightweight mineral-chemical hybrid sunscreen with SPF 50+ and PA++++ protection. No white cast, suitable for Indian skin tones.',
    price: 649,
    compare_price: 899,
    status: 'published',
    is_featured: true,
    categorySlug: 'sunscreen',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800',
    variants: [
      { label: '50g', price: 649, stock_qty: 80, sku: 'SPF-50G' },
    ],
    collections: ['featured-products', 'best-sellers'],
  },
  {
    name: 'Vitamin C Brightening Serum',
    slug: 'vitamin-c-brightening-serum',
    short_desc: '15% stable Vitamin C for radiant, even skin tone.',
    description: 'Our stable 15% Ethyl Ascorbic Acid formula brightens dark spots, reduces hyperpigmentation, and gives a natural glow with daily use.',
    price: 899,
    compare_price: 1299,
    status: 'published',
    is_featured: true,
    categorySlug: 'serums',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=800',
    variants: [
      { label: '30ml', price: 899, stock_qty: 35, sku: 'VITC-30ML' },
    ],
    collections: ['new-arrivals', 'featured-products'],
  },
];

// ── Seed functions ───────────────────────────────────────────────────────────

async function upsertPages(shopId: string, shopName: string) {
  const slug = shopName.toLowerCase().replace(/\s/g, '');

  const pages = [
    {
      slug: 'about',
      title: 'About Us',
      sections: [
        { type: 'hero', data: { title: 'About Us', subtitle: 'Skincare rooted in science, crafted with care.' } },
        {
          type: 'image_text',
          data: {
            image_side: 'right',
            image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800',
            title: 'Our Story',
            text: `${shopName} was founded with a simple belief — effective skincare should not cost a fortune. Every formula is clinically backed, free of harmful fillers, and designed to actually work.`,
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
        { type: 'cta', data: { title: 'Ready to start your skin journey?', button_label: 'Shop All Products', button_url: '/products' } },
      ],
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      sections: [
        { type: 'hero', data: { title: 'Contact Us', subtitle: 'We typically respond to all queries within 24 hours.' } },
        { type: 'contact_form', data: { title: 'Send us a message', subtitle: 'Fill out the form and our team will get back to you shortly.' } },
        {
          type: 'cards',
          data: {
            title: 'Other Ways to Reach Us',
            items: [
              { icon: '📧', title: 'Email', text: `support@${slug}.com` },
              { icon: '📞', title: 'Phone', text: '+91 98765 43210\nMon–Fri, 9 AM – 6 PM IST' },
              { icon: '📍', title: 'Location', text: 'Bengaluru, Karnataka, India' },
            ],
          },
        },
      ],
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      sections: [
        { type: 'hero', data: { title: 'Privacy Policy', subtitle: 'Your privacy matters. Here is how we handle your data.' } },
        {
          type: 'rich_text',
          data: {
            html: `<h3>What we collect</h3><p>When you place an order we collect your name, email, shipping address, and payment information necessary to fulfil your purchase.</p><h3>How we use it</h3><p>We use your information to process orders, send shipping updates, and provide customer support.</p><h3>What we do not do</h3><p>We never sell or rent your personal data to third parties.</p><h3>Data security</h3><p>All transactions are encrypted using SSL/TLS. For questions email <strong>privacy@${slug}.com</strong>.</p>`,
          },
        },
      ],
    },
    {
      slug: 'terms',
      title: 'Terms & Conditions',
      sections: [
        { type: 'hero', data: { title: 'Terms & Conditions', subtitle: 'Please read these terms carefully before using our store.' } },
        {
          type: 'rich_text',
          data: {
            html: `<h3>Acceptance</h3><p>By accessing this website you agree to be bound by these terms of service.</p><h3>Products</h3><p>All product descriptions are accurate to the best of our knowledge. Colours may vary slightly.</p><h3>Pricing</h3><p>All prices are in Indian Rupees (INR) and include applicable GST. Prices may change without notice.</p><h3>Orders</h3><p>Once confirmed, orders cannot be modified. Cancellations may be possible within 2 hours by contacting support.</p><h3>Intellectual Property</h3><p>All content on this site is the property of ${shopName} and may not be reproduced without permission.</p>`,
          },
        },
      ],
    },
    {
      slug: 'refund',
      title: 'Refund Policy',
      sections: [
        { type: 'hero', data: { title: 'Refund & Returns', subtitle: 'Not happy? We make it right.' } },
        {
          type: 'cards',
          data: {
            title: 'At a Glance',
            items: [
              { icon: '📦', title: '14-Day Returns', text: 'Return unopened items within 14 days of delivery.' },
              { icon: '✅', title: 'Easy Process', text: 'Email us with your order number. We handle the rest.' },
              { icon: '💳', title: 'Fast Refunds', text: 'Approved refunds arrive within 5–7 business days.' },
            ],
          },
        },
        {
          type: 'rich_text',
          data: {
            html: `<h3>Eligibility</h3><p>Items must be unopened, in original packaging, with seals intact.</p><h3>Non-returnable items</h3><p>Opened skincare products cannot be returned for hygiene reasons unless defective.</p><h3>Defective items</h3><p>Contact us within <strong>48 hours</strong> of delivery with photos. We arrange a free replacement or full refund.</p><h3>How to start</h3><p>Email <strong>returns@${slug}.com</strong> with your order number and reason.</p>`,
          },
        },
      ],
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { shop_id_slug: { shop_id: shopId, slug: page.slug } },
      update: { sections: page.sections },
      create: { shop_id: shopId, slug: page.slug, title: page.title, sections: page.sections, status: 'published' },
    });
  }
  console.log(`  ✓ Pages upserted (${pages.length})`);
}

async function upsertCollections(shopId: string) {
  const collections = [
    { name: 'New Arrivals', slug: 'new-arrivals', description: 'Freshly added to the store' },
    { name: 'Best Sellers', slug: 'best-sellers', description: 'Customer favourites' },
    { name: 'Featured Products', slug: 'featured-products', description: 'Highlighted picks of the month' },
  ];

  const results: Record<string, string> = {};
  for (const c of collections) {
    const existing = await prisma.collection.findFirst({ where: { shop_id: shopId, slug: c.slug } });
    if (existing) {
      results[c.slug] = existing.id;
    } else {
      const created = await prisma.collection.create({ data: { shop_id: shopId, ...c, is_active: true } });
      results[c.slug] = created.id;
    }
  }
  console.log(`  ✓ Collections upserted (${collections.length})`);
  return results;
}

async function upsertCategories(shopId: string) {
  const results: Record<string, string> = {};
  for (const cat of DEMO_CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { shop_id: shopId, slug: cat.slug } });
    if (existing) {
      results[cat.slug] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { shop_id: shopId, name: cat.name, slug: cat.slug, is_active: true },
      });
      results[cat.slug] = created.id;
    }
  }
  console.log(`  ✓ Categories upserted (${DEMO_CATEGORIES.length})`);
  return results;
}

async function upsertProducts(shopId: string, shopSlug: string, categoryIds: Record<string, string>, collectionIds: Record<string, string>) {
  let created = 0;
  let skipped = 0;

  for (const p of DEMO_PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { shop_id: shopId, slug: p.slug } });
    if (existing) { skipped++; continue; }

    const product = await prisma.product.create({
      data: {
        shop_id: shopId,
        name: p.name,
        slug: p.slug,
        short_desc: p.short_desc,
        description: p.description,
        price: p.price,
        compare_price: p.compare_price,
        status: p.status,
        is_featured: p.is_featured,
        category_id: categoryIds[p.categorySlug] ?? null,
        has_variants: p.variants.length > 1,
      },
    });

    // Gallery image
    await prisma.productGallery.create({
      data: { product_id: product.id, shop_id: shopId, url: p.image, is_cover: true, sort_order: 0 },
    });

    // Variants
    for (const v of p.variants) {
      await prisma.productVariant.create({
        data: {
          product_id: product.id,
          shop_id: shopId,
          label: v.label,
          price: v.price,
          stock_qty: v.stock_qty,
          sku: `${shopSlug.toUpperCase()}-${v.sku}`,
          is_active: true,
        },
      });
    }

    // Link to collections
    for (const collSlug of p.collections) {
      const collId = collectionIds[collSlug];
      if (collId) {
        await prisma.collectionProduct.create({
          data: { collection_id: collId, product_id: product.id },
        });
      }
    }

    created++;
  }

  console.log(`  ✓ Products: ${created} created, ${skipped} already existed`);
}

async function upsertBanner(shopId: string) {
  const existing = await prisma.banner.findFirst({ where: { shop_id: shopId } });
  if (!existing) {
    await prisma.banner.create({
      data: {
        shop_id: shopId,
        title: 'Discover Nature-Inspired Skincare',
        image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1600',
        link_url: '/products',
        is_active: true,
        sort_order: 0,
      },
    });
    console.log('  ✓ Banner created');
  } else {
    console.log('  ✓ Banner already exists, skipped');
  }
}

async function upsertPaymentGateways(shopId: string) {
  const cod = await prisma.paymentGateway.findFirst({ where: { shop_id: shopId, slug: 'cod' } });
  if (!cod) {
    await prisma.paymentGateway.createMany({
      data: [
        { shop_id: shopId, name: 'Cash on Delivery', slug: 'cod', is_active: true, sort_order: 1 },
        { shop_id: shopId, name: 'Razorpay', slug: 'razorpay', is_active: false, sort_order: 2, config: { key_id: '', key_secret: '' } },
      ],
    });
    console.log('  ✓ Payment gateways created');
  } else {
    console.log('  ✓ Payment gateways already exist, skipped');
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await prisma.$connect();

  // Resolve shop
  const shop = await prisma.shop.findFirst({
    where: SHOP_ID ? { id: SHOP_ID } : { slug: SHOP_SLUG! },
  });

  if (!shop) {
    console.error(`Shop not found: ${SHOP_ID ? `id=${SHOP_ID}` : `slug=${SHOP_SLUG}`}`);
    process.exit(1);
  }

  console.log(`\nSeeding shop: "${shop.name}" (${shop.id})\n`);

  await upsertPages(shop.id, shop.name);
  const collectionIds = await upsertCollections(shop.id);
  const categoryIds = await upsertCategories(shop.id);
  await upsertProducts(shop.id, shop.slug, categoryIds, collectionIds);
  await upsertBanner(shop.id);
  await upsertPaymentGateways(shop.id);

  console.log(`\nDone. Visit: http://${shop.slug}.localhost:3001\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
