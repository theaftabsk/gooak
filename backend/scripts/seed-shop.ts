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
  { name: 'Serums',        slug: 'serums',        image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800' },
  { name: 'Moisturisers', slug: 'moisturisers',   image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800' },
  { name: 'Cleansers',    slug: 'cleansers',       image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=800' },
  { name: 'Sunscreen',    slug: 'sunscreen',       image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800' },
];

const DEMO_PRODUCTS = [
  // ── Serums (5) ────────────────────────────────────────────────────────────────
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
  {
    name: 'Retinol 0.5% Anti-Aging Serum',
    slug: 'retinol-05-anti-aging-serum',
    short_desc: 'Reduces fine lines and wrinkles with encapsulated retinol.',
    description: 'Encapsulated Retinol 0.5% is gradually released into the skin for maximum efficacy with minimal irritation. Ideal for beginners to retinol looking to target signs of aging.',
    price: 1099,
    compare_price: 1499,
    status: 'published',
    is_featured: true,
    categorySlug: 'serums',
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?q=80&w=800',
    variants: [
      { label: '30ml', price: 1099, stock_qty: 25, sku: 'RETN-30ML' },
    ],
    collections: ['best-sellers', 'featured-products'],
  },
  {
    name: 'AHA BHA 10% Exfoliating Serum',
    slug: 'aha-bha-exfoliating-serum',
    short_desc: 'Dual-acid blend for visibly smoother, clearer skin.',
    description: 'A blend of 7% Glycolic Acid (AHA) and 3% Salicylic Acid (BHA) that exfoliates both the surface and pores. Targets blackheads, texture, and dullness for brighter skin in 4 weeks.',
    price: 799,
    compare_price: 1099,
    status: 'published',
    is_featured: false,
    categorySlug: 'serums',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800',
    variants: [
      { label: '30ml', price: 799, stock_qty: 40, sku: 'AHBHA-30ML' },
    ],
    collections: ['new-arrivals'],
  },
  {
    name: 'Peptide Firming Serum',
    slug: 'peptide-firming-serum',
    short_desc: 'Five peptides that visibly firm and plump the skin.',
    description: 'A cocktail of five signal peptides work synergistically to firm skin, reduce the appearance of wrinkles, and boost collagen production for a visibly younger-looking complexion.',
    price: 1249,
    compare_price: 1699,
    status: 'published',
    is_featured: false,
    categorySlug: 'serums',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800',
    variants: [
      { label: '30ml', price: 1249, stock_qty: 20, sku: 'PEPT-30ML' },
    ],
    collections: ['featured-products'],
  },

  // ── Moisturisers (5) ──────────────────────────────────────────────────────────
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
    name: 'Ceramide Barrier Repair Cream',
    slug: 'ceramide-barrier-repair-cream',
    short_desc: 'Rebuilds the skin barrier with 3 essential ceramides.',
    description: 'Formulated with Ceramides 1, 3, and 6-II alongside Cholesterol and Fatty Acids to mimic the skin\'s natural lipid barrier. Ideal for sensitive, dry, and eczema-prone skin.',
    price: 999,
    compare_price: 1399,
    status: 'published',
    is_featured: true,
    categorySlug: 'moisturisers',
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=800',
    variants: [
      { label: '50ml', price: 999, stock_qty: 30, sku: 'CER-50ML' },
      { label: '100ml', price: 1699, stock_qty: 15, sku: 'CER-100ML' },
    ],
    collections: ['best-sellers'],
  },
  {
    name: 'Vitamin E Night Cream',
    slug: 'vitamin-e-night-cream',
    short_desc: 'Nourishing overnight cream that repairs while you sleep.',
    description: 'Rich in Vitamin E, Squalane, and Shea Butter, this deeply nourishing night cream works overnight to replenish moisture, improve skin elasticity, and help you wake up to plumper, softer skin.',
    price: 749,
    compare_price: 999,
    status: 'published',
    is_featured: false,
    categorySlug: 'moisturisers',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800',
    variants: [
      { label: '50ml', price: 749, stock_qty: 45, sku: 'VITE-50ML' },
    ],
    collections: ['new-arrivals', 'featured-products'],
  },
  {
    name: 'Aloe Vera Gel Moisturiser',
    slug: 'aloe-vera-gel-moisturiser',
    short_desc: '99% pure aloe vera gel for instant cooling hydration.',
    description: 'Made from cold-pressed 99% pure Aloe Vera, this lightweight gel-moisturiser soothes, cools, and hydrates all skin types. Perfect after sun exposure or as a daily hydrator in summer.',
    price: 399,
    compare_price: 549,
    status: 'published',
    is_featured: false,
    categorySlug: 'moisturisers',
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?q=80&w=800',
    variants: [
      { label: '100ml', price: 399, stock_qty: 70, sku: 'ALOE-100ML' },
      { label: '200ml', price: 699, stock_qty: 35, sku: 'ALOE-200ML' },
    ],
    collections: ['new-arrivals'],
  },
  {
    name: 'Oil Control Day Cream SPF 20',
    slug: 'oil-control-day-cream-spf20',
    short_desc: 'Matte-finish moisturiser with built-in sun protection.',
    description: 'Lightweight oil-free day cream with Zinc and Niacinamide that controls sebum through the day. SPF 20 protection included for everyday use. Non-comedogenic, perfect for oily and combination skin.',
    price: 649,
    compare_price: 899,
    status: 'published',
    is_featured: false,
    categorySlug: 'moisturisers',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800',
    variants: [
      { label: '50ml', price: 649, stock_qty: 50, sku: 'OCC-50ML' },
    ],
    collections: ['best-sellers'],
  },

  // ── Cleansers (5) ─────────────────────────────────────────────────────────────
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
    name: 'Salicylic Acid 2% Face Wash',
    slug: 'salicylic-acid-face-wash',
    short_desc: 'BHA cleanser that unclogs pores and fights acne.',
    description: '2% Salicylic Acid penetrates deep into pores to dissolve blackheads, reduce whiteheads, and prevent future breakouts. Gentle enough for daily use on oily and acne-prone skin.',
    price: 499,
    compare_price: 699,
    status: 'published',
    is_featured: true,
    categorySlug: 'cleansers',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800',
    variants: [
      { label: '100ml', price: 499, stock_qty: 55, sku: 'SALIC-100ML' },
    ],
    collections: ['best-sellers', 'featured-products'],
  },
  {
    name: 'Micellar Water Cleanser',
    slug: 'micellar-water-cleanser',
    short_desc: 'No-rinse micellar water that removes makeup effortlessly.',
    description: 'Gentle micellar technology captures and lifts away makeup, sunscreen, and impurities without rubbing or rinsing. No parabens, alcohol, or fragrance. Perfect for sensitive skin.',
    price: 449,
    compare_price: 599,
    status: 'published',
    is_featured: false,
    categorySlug: 'cleansers',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800',
    variants: [
      { label: '200ml', price: 449, stock_qty: 40, sku: 'MIC-200ML' },
      { label: '400ml', price: 799, stock_qty: 20, sku: 'MIC-400ML' },
    ],
    collections: ['new-arrivals', 'best-sellers'],
  },
  {
    name: 'Cleansing Balm with Vitamin E',
    slug: 'cleansing-balm-vitamin-e',
    short_desc: 'Oil-based balm that melts away makeup and sunscreen.',
    description: 'This luxurious oil-to-milk cleansing balm melts onto skin to dissolve waterproof makeup, SPF, and stubborn impurities. Enriched with Vitamin E and Jojoba Oil it leaves skin feeling nourished, not stripped.',
    price: 799,
    compare_price: 1099,
    status: 'published',
    is_featured: false,
    categorySlug: 'cleansers',
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=800',
    variants: [
      { label: '100ml', price: 799, stock_qty: 30, sku: 'BALM-100ML' },
    ],
    collections: ['featured-products'],
  },
  {
    name: 'Neem & Tea Tree Face Wash',
    slug: 'neem-tea-tree-face-wash',
    short_desc: 'Antibacterial wash with neem and tea tree for clear skin.',
    description: 'Harnesses the antibacterial power of Neem Leaf Extract and Tea Tree Oil to fight acne-causing bacteria, control sebum, and purify pores. Leaves skin feeling fresh without over-drying.',
    price: 349,
    compare_price: 499,
    status: 'published',
    is_featured: false,
    categorySlug: 'cleansers',
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?q=80&w=800',
    variants: [
      { label: '100ml', price: 349, stock_qty: 80, sku: 'NEEM-100ML' },
      { label: '200ml', price: 599, stock_qty: 40, sku: 'NEEM-200ML' },
    ],
    collections: ['new-arrivals'],
  },

  // ── Sunscreen (5) ─────────────────────────────────────────────────────────────
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
    image: 'https://images.unsplash.com/photo-1609178961882-b1e53ae81e35?q=80&w=800',
    variants: [
      { label: '50g', price: 649, stock_qty: 80, sku: 'SPF-50G' },
    ],
    collections: ['featured-products', 'best-sellers'],
  },
  {
    name: 'Tinted Sunscreen SPF 30',
    slug: 'tinted-sunscreen-spf30',
    short_desc: 'Light coverage tinted sunscreen that evens skin tone.',
    description: 'A sheer, buildable tint blended with SPF 30 PA+++ protection for light daily coverage. Ideal for bare-skin days when you want coverage and protection in one step.',
    price: 799,
    compare_price: 1099,
    status: 'published',
    is_featured: true,
    categorySlug: 'sunscreen',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800',
    variants: [
      { label: '30ml', price: 799, stock_qty: 45, sku: 'TSPF-30ML' },
    ],
    collections: ['new-arrivals', 'best-sellers'],
  },
  {
    name: 'Sport Sunscreen SPF 60',
    slug: 'sport-sunscreen-spf60',
    short_desc: 'Water-resistant SPF 60 for outdoor and active lifestyles.',
    description: 'Extra-high SPF 60 PA++++ water-resistant formula designed for active outdoor use. Stays effective for 80 minutes in water. Reef-safe mineral filters with no oxybenzone or octinoxate.',
    price: 849,
    compare_price: 1199,
    status: 'published',
    is_featured: false,
    categorySlug: 'sunscreen',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800',
    variants: [
      { label: '100ml', price: 849, stock_qty: 35, sku: 'SPORT-100ML' },
    ],
    collections: ['featured-products'],
  },
  {
    name: 'Invisible Sunscreen Stick SPF 50',
    slug: 'sunscreen-stick-spf50',
    short_desc: 'On-the-go stick format — swipe and go, no white cast.',
    description: 'Compact, mess-free sunscreen stick with SPF 50+ PA+++ protection. The clear glide formula leaves zero white cast. Perfect for reapplying over makeup throughout the day.',
    price: 599,
    compare_price: 799,
    status: 'published',
    is_featured: false,
    categorySlug: 'sunscreen',
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?q=80&w=800',
    variants: [
      { label: '15g', price: 599, stock_qty: 60, sku: 'SSTK-15G' },
    ],
    collections: ['new-arrivals'],
  },
  {
    name: 'After Sun Soothing Gel',
    slug: 'after-sun-soothing-gel',
    short_desc: 'Cooling aloe gel that calms sun-stressed skin.',
    description: 'A refreshing post-sun gel with Aloe Vera, Panthenol, and Green Tea Extract to calm redness, restore moisture, and help repair sun-damaged skin. Use after beach, pool, or any prolonged sun exposure.',
    price: 449,
    compare_price: 599,
    status: 'published',
    is_featured: false,
    categorySlug: 'sunscreen',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800',
    variants: [
      { label: '150ml', price: 449, stock_qty: 50, sku: 'AFTSUN-150ML' },
    ],
    collections: ['new-arrivals', 'featured-products'],
  },
];

// ── Seed functions ───────────────────────────────────────────────────────────

async function upsertPages(shopId: string, shopName: string) {
  const slug = shopName.toLowerCase().replace(/\s/g, '');

  const pages = [
    {
      slug: 'home',
      title: 'Home',
      sections: [
        { type: 'announcement_bar', data: { text: `🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500 — Welcome to ${shopName}!`, active: true } },
        { type: 'banner_slider', data: { banners: [
          { title: 'Discover Natural Beauty', image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1400', link_url: '/products' },
          { title: 'Summer Flash Sale', image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1400', link_url: '/collections/sale' },
          { title: 'New Arrivals', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1400', link_url: '/collections/new-arrivals' },
        ] } },
        { type: 'categories_carousel', data: { badge: 'Collections', title: 'Product Categories' } },
        { type: 'products_grid', data: { badge: 'Trending', title: 'Best Sellers', subtitle: "Deals You Can't Miss", limit: 4, view_all_url: '/products', view_all_label: 'VIEW ALL →' } },
        { type: 'products_grid', data: { badge: 'New Arrivals', title: 'Featured Collection', limit: 8, columns: 4, view_all_url: '/products' } },
        { type: 'features_strip', data: {} },
        { type: 'about_section', data: { title: `About ${shopName}`, content: `${shopName} was founded with a simple belief — effective products should not cost a fortune. Every item is carefully curated and designed to actually work.`, tagline: '"Quality you can trust."' } },
        { type: 'cta', data: { title: 'Start your journey today', subtitle: 'Join thousands of happy customers.', button_label: 'Shop All Products', button_url: '/products', button2_label: 'Our Story', button2_url: '/about' } },
      ],
    },
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
      if (!existing.image_url && cat.image_url) {
        await prisma.category.update({ where: { id: existing.id }, data: { image_url: cat.image_url } });
      }
      results[cat.slug] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { shop_id: shopId, name: cat.name, slug: cat.slug, image_url: cat.image_url ?? null, is_active: true },
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

async function upsertPageContent(shopId: string, shopName: string) {
  const defaults: Record<string, string> = {
    // Theme
    color_bg: '#FAF7F2',
    color_surface: '#FFFFFF',
    color_text: '#1F2937',
    color_muted: '#6B7280',
    color_primary: '#111827',
    color_accent: '#15803D',
    color_accent_hover: '#166534',
    color_border: '#E5E7EB',
    color_footer_bg: '#111827',
    font_heading: 'Playfair Display',
    font_body: 'Inter',

    // Announcement bar
    announcement_bar: `🌿 FREE SHIPPING ON ORDERS ABOVE ₹500 — Welcome to ${shopName}!`,
    announcement_bar_active: 'true',

    // About section
    about_title: `About ${shopName}`,
    about_content: `We are a natural beauty and wellness brand committed to bringing you the finest quality products. Each formulation is carefully crafted using ethically sourced ingredients.`,
    about_tagline: '"Live Healthy. Stay Beautiful."',
    value_quality: 'All ingredients certified natural and organic.',
    value_care: 'No harmful additives or parabens — ever.',
    value_empowerment: 'Supporting fair-trade and local communities.',
    value_delivery: 'Fast, reliable shipping across India.',

    // CTA section
    cta_title: 'Start Your Journey',
    cta_subtitle: 'Premium quality products, delivered to your door.',
    cta_btn1_text: 'Shop All',
    cta_btn1_link: '/products',
    cta_btn2_text: 'Our Story',
    cta_btn2_link: '/about',

    // Footer – store info
    footer_tagline: `Quality ${shopName} products, delivered with care.`,
    footer_copyright: `© ${new Date().getFullYear()} ${shopName}. All rights reserved.`,

    // Footer – contact
    contact_email: `hello@${shopName.toLowerCase().replace(/\s+/g, '')}.com`,
    contact_phone: '',
    contact_address: '',

    // Footer – social (empty by default, merchant fills in)
    social_instagram: '',
    social_facebook: '',
    social_twitter: '',
    social_youtube: '',
    social_linkedin: '',
    social_pinterest: '',

    // Footer – newsletter
    footer_newsletter: 'true',
    footer_newsletter_heading: 'Stay in the loop',
    footer_newsletter_placeholder: 'Enter your email address',

    // Footer – column 1 (Shop)
    footer_col1_title: 'Shop',
    footer_col1_links: JSON.stringify([
      { title: 'Home', url: '/' },
      { title: 'All Products', url: '/products' },
      { title: 'Categories', url: '/categories' },
      { title: 'Collections', url: '/collections' },
      { title: 'Search', url: '/search' },
    ]),

    // Footer – column 2 (Account)
    footer_col2_title: 'Account',
    footer_col2_links: JSON.stringify([
      { title: 'Sign In', url: '/login' },
      { title: 'Create Account', url: '/register' },
      { title: 'My Orders', url: '/account/orders' },
      { title: 'Wishlist', url: '/wishlist' },
      { title: 'Track Order', url: '/track-order' },
    ]),

    // Footer – column 3 (Information)
    footer_col3_title: 'Information',
    footer_menu: JSON.stringify([
      { title: 'About Us', url: '/about' },
      { title: 'Contact Us', url: '/contact' },
      { title: 'Privacy Policy', url: '/privacy' },
      { title: 'Terms & Conditions', url: '/terms' },
      { title: 'Refund Policy', url: '/refund' },
    ]),

    // Footer – bottom bar
    footer_bottom_links: JSON.stringify([
      { title: 'Privacy', url: '/privacy' },
      { title: 'Terms', url: '/terms' },
      { title: 'Sitemap', url: '/sitemap' },
    ]),
  };

  const promises = Object.entries(defaults).map(([key, value]) =>
    prisma.setting.upsert({
      where: { shop_id_key: { shop_id: shopId, key } },
      create: { shop_id: shopId, key, value, group: 'pages' },
      update: {},
    }),
  );
  await Promise.all(promises);
  console.log(`  ✓ Page content & footer settings seeded (${Object.keys(defaults).length} keys)`);
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
  await upsertPageContent(shop.id, shop.name);

  console.log(`\nDone. Visit: http://${shop.slug}.localhost:3001\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
