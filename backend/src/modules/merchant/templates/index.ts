export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
}

export interface WidgetConfig {
  type: string;
  content: any;
  styles?: any;
}

export interface TemplateConfig {
  theme: ThemeConfig;
  homepage: WidgetConfig[];
  settings: Record<string, string>;
}

export const TEMPLATES: Record<string, Record<string, TemplateConfig>> = {
  fashion: {
    classic: {
      theme: {
        primaryColor: '#1E293B',
        secondaryColor: '#F59E0B',
        backgroundColor: '#F9F6F0',
        fontFamily: 'Playfair Display, serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Timeless Style & Classic Cuts',
            subtitle: 'Curated apparel for modern elegance.',
            image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'center',
          },
        },
        {
          type: 'CATEGORIES_LIST',
          content: {},
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Featured Collection',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '✨ End of Season Sale: Flat 20% off classic collection',
        announcement_bar_active: 'true',
        about_title: 'Our Heritage',
        about_tagline: 'Timeless elegance since 2012',
        about_content: 'We believe that style transcends time. Our garments are meticulously crafted with premium fabrics and classic silhouettes designed to remain staples in your wardrobe for years to come.',
      },
    },
    modern: {
      theme: {
        primaryColor: '#0F172A',
        secondaryColor: '#EC4899',
        backgroundColor: '#FAF9F6',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Urban Vibe Collection',
            subtitle: 'Bold styles for the contemporary generation.',
            image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200',
          },
          styles: {
            paddingTop: '100px',
            paddingBottom: '100px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Trending Right Now',
            limit: 8,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '⚡ Free Shipping on all orders above $75!',
        announcement_bar_active: 'true',
        about_title: 'Modern Vision',
        about_tagline: 'Expressive streetwear for everyone',
        about_content: 'Born on the streets, designed for the runway. We combine casual streetwear with high-fashion aesthetics to bring you comfortable, expressive clothing that speaks volumes.',
      },
    },
    luxury: {
      theme: {
        primaryColor: '#111827',
        secondaryColor: '#D97706',
        backgroundColor: '#FCFBF7',
        fontFamily: 'Cinzel, serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Exquisite Haute Couture',
            subtitle: 'Premium designs crafted with artisanal excellence.',
            image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200',
          },
          styles: {
            paddingTop: '120px',
            paddingBottom: '120px',
            textAlign: 'center',
          },
        },
        {
          type: 'DOUBLE_HERO',
          content: {
            title1: 'Luxe Menswear',
            subtitle1: 'Tailored suits & shirts',
            image_url1: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600',
            title2: 'Luxe Womenswear',
            subtitle2: 'Silks & formal gowns',
            image_url2: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600',
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'The Signature Series',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '✨ Private Runway Access: Shop the collection now',
        announcement_bar_active: 'true',
        about_title: 'Artisanal Luxury',
        about_tagline: 'Hand-sewn detail & premium silk options',
        about_content: 'Luxury is in the details. Every thread, bead, and pattern is custom designed and individually inspected by our lead designers to guarantee a flawless premium luxury apparel experience.',
      },
    },
  },
  electronics: {
    dark: {
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        backgroundColor: '#0B0F19',
        fontFamily: 'Orbitron, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Next-Gen Cyber Space Tech',
            subtitle: 'Level up your gaming setup and smart devices.',
            image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200',
          },
          styles: {
            paddingTop: '90px',
            paddingBottom: '90px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Premium Cyber Gear',
            limit: 8,
          },
          styles: {
            paddingTop: '50px',
            paddingBottom: '50px',
          },
        },
      ],
      settings: {
        announcement_bar: '🎮 Gamer Special: Get a free high-speed mousepad with any keyboard purchase',
        announcement_bar_active: 'true',
        about_title: 'Built by Gamers',
        about_tagline: 'Precision equipment for virtual worlds',
        about_content: 'We design premium, ultra-low latency technology and immersive sound setups to give you the ultimate edge in competitiveness and entertainment experiences.',
      },
    },
    modern: {
      theme: {
        primaryColor: '#4F46E5',
        secondaryColor: '#F59E0B',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Smart Automation Hub',
            subtitle: 'Smarter tools for responsive modern living.',
            image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'center',
          },
        },
        {
          type: 'CATEGORIES_LIST',
          content: {},
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Featured Gadgets',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '💡 Smart Home Promo: 10% off automated light packs',
        announcement_bar_active: 'true',
        about_title: 'Smart Innovation',
        about_tagline: 'Bridging logic with comfort',
        about_content: 'OakSol Smart Living is dedicated to designing intuitive automation devices that connect effortlessly to your phone, ensuring energy efficiency and premium security.',
      },
    },
    premium: {
      theme: {
        primaryColor: '#1F2937',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#F3F4F6',
        fontFamily: 'Outfit, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'High-Fidelity Sound Systems',
            subtitle: 'Hear the details you’ve been missing.',
            image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1200',
          },
          styles: {
            paddingTop: '100px',
            paddingBottom: '100px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Studio Grade Equipment',
            limit: 4,
          },
          styles: {
            paddingTop: '45px',
            paddingBottom: '45px',
          },
        },
      ],
      settings: {
        announcement_bar: '🎧 Studio Special: Free carrying case with audiophile headphones',
        announcement_bar_active: 'true',
        about_title: 'Pure Acoustics',
        about_tagline: 'Engineered for clean frequency response',
        about_content: 'Music is an art, and we treat it with absolute fidelity. Our custom-engineered audio equipment ensures accurate highs, rich mids, and a satisfying, punchy bass.',
      },
    },
  },
  grocery: {
    fresh: {
      theme: {
        primaryColor: '#16A34A',
        secondaryColor: '#F59E0B',
        backgroundColor: '#F4FBF7',
        fontFamily: 'Quicksand, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Farm Fresh Organic Harvest',
            subtitle: 'Direct from fields to your kitchen table.',
            image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200',
          },
          styles: {
            paddingTop: '75px',
            paddingBottom: '75px',
            textAlign: 'center',
          },
        },
        {
          type: 'CATEGORIES_LIST',
          content: {},
          styles: {
            paddingTop: '30px',
            paddingBottom: '30px',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Fresh Produce Deals',
            limit: 8,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🥬 Fresh Alert: Hand-picked greens delivered within 3 hours!',
        announcement_bar_active: 'true',
        about_title: 'Naturally Sourced',
        about_tagline: 'Pesticide-free food & sustainable farming support',
        about_content: 'We partner directly with family farms to source fresh, organic groceries. We skip unnecessary warehouses to reduce delivery times and minimize environmental impact.',
      },
    },
    organic: {
      theme: {
        primaryColor: '#15803D',
        secondaryColor: '#10B981',
        backgroundColor: '#FAFDFB',
        fontFamily: 'Outfit, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: '100% Certified Organic Foods',
            subtitle: 'Zero chemicals, absolute purity.',
            image_url: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Organic Staples',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🌾 Superfood Promo: Up to 15% off certified grains',
        announcement_bar_active: 'true',
        about_title: 'Chemical Free Life',
        about_tagline: 'Certified produce for healthy lifestyles',
        about_content: 'Health is a journey that begins with food. Our products carry international organic certifications to verify they are grown without chemical pesticides or GMOs.',
      },
    },
    wholesale: {
      theme: {
        primaryColor: '#166534',
        secondaryColor: '#D97706',
        backgroundColor: '#F5F5F4',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Bulk Wholesale Groceries',
            subtitle: 'Unbeatable factory-direct pricing on bulk orders.',
            image_url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1200',
          },
          styles: {
            paddingTop: '70px',
            paddingBottom: '70px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Wholesale Pallets',
            limit: 6,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '📦 Wholesale Promo: Extra 5% off on orders exceeding 50kg',
        announcement_bar_active: 'true',
        about_title: 'Bulk Distribution',
        about_tagline: 'B2B supply lines & logistics solutions',
        about_content: 'We streamline distribution for commercial kitchens, hotels, and retail shops. We guarantee steady supply chains, cold storage shipping, and competitive pricing tiers.',
      },
    },
  },
  restaurant: {
    gourmet: {
      theme: {
        primaryColor: '#EA580C',
        secondaryColor: '#F59E0B',
        backgroundColor: '#FFF7ED',
        fontFamily: 'Merriweather, serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Masterfully Crafted Gourmet Cuisine',
            subtitle: 'Fine dining experiences delivered to your doorstep.',
            image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200',
          },
          styles: {
            paddingTop: '90px',
            paddingBottom: '90px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Signature Dishes',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
        {
          type: 'TESTIMONIALS',
          content: {
            title: 'What Food Critics Say',
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🍷 Gourmet Special: Free dessert with any chef signature main course!',
        announcement_bar_active: 'true',
        about_title: 'Art of Gastronomy',
        about_tagline: 'Curated menu by Michelin-starred culinary teams',
        about_content: 'We treat cooking as a fine art. We import raw spices directly and source prime ingredients locally to craft dishes that stimulate all five senses.',
      },
    },
    fastfood: {
      theme: {
        primaryColor: '#DC2626',
        secondaryColor: '#EAB308',
        backgroundColor: '#FFFBEB',
        fontFamily: 'Impact, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Sizzling Burgers & Hot Crispy Fries',
            subtitle: 'Fast delivery, fresh ingredients, maximum flavor.',
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Fast Favorites',
            limit: 8,
          },
          styles: {
            paddingTop: '35px',
            paddingBottom: '35px',
          },
        },
      ],
      settings: {
        announcement_bar: '🍔 Burger Madness: Buy 1 burger, get the second one at 50% off!',
        announcement_bar_active: 'true',
        about_title: 'Quick & Tasty',
        about_tagline: 'Flamed-broiled flavor in minutes',
        about_content: 'Fast food doesn\'t have to be bland. We prepare real beef patties and hand-cut fries fresh daily to serve fast, flame-cooked comfort food that satisfies cravings.',
      },
    },
    cafe: {
      theme: {
        primaryColor: '#78350F',
        secondaryColor: '#F59E0B',
        backgroundColor: '#FAF6F0',
        fontFamily: 'Quicksand, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Freshly Roasted Specialty Coffee',
            subtitle: 'Cozy vibes and artisanal brews in every cup.',
            image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200',
          },
          styles: {
            paddingTop: '85px',
            paddingBottom: '85px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Cafe Brews & Pastries',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '☕ Morning Brew: Get a free cookie with any large cappuccino before 10 AM',
        announcement_bar_active: 'true',
        about_title: 'Boutique Coffee Roasters',
        about_tagline: 'Single-origin beans roasted in small batches',
        about_content: 'We travel to high-altitude coffee estates to select the finest Arabica beans. We light-roast them weekly to ensure you receive rich, aromatic notes with minimal bitterness.',
      },
    },
  },
  furniture: {
    minimalist: {
      theme: {
        primaryColor: '#78350F',
        secondaryColor: '#F59E0B',
        backgroundColor: '#FAF7F5',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Minimalist Wooden Living Space',
            subtitle: 'Functional design objects for modern rooms.',
            image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200',
          },
          styles: {
            paddingTop: '90px',
            paddingBottom: '90px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Minimalist Furniture',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🛋 Minimalist Room Set: Save 15% on curated sets',
        announcement_bar_active: 'true',
        about_title: 'Modern Architecture',
        about_tagline: 'Form meets function in daily design',
        about_content: 'We design modular furniture that makes small rooms feel open. We focus on durability, clean aesthetics, and eco-friendly wood sourcing.',
      },
    },
    vintage: {
      theme: {
        primaryColor: '#451A03',
        secondaryColor: '#D97706',
        backgroundColor: '#FBF9F6',
        fontFamily: 'Lora, serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Crafted Vintage Furniture',
            subtitle: 'Solid oak and teak statement furniture pieces.',
            image_url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Heritage Designs',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🪵 Heritage Event: Complimentary beeswax wood polish with any cabinet',
        announcement_bar_active: 'true',
        about_title: 'Our Craftsmanship',
        about_tagline: 'Hand-lathed joinery built for generations',
        about_content: 'We keep classic woodworking techniques alive. Our craftsmen use traditional tenon joint methods to ensure your furniture stands sturdy for decades.',
      },
    },
    luxury: {
      theme: {
        primaryColor: '#1F2937',
        secondaryColor: '#D97706',
        backgroundColor: '#F9FAF8',
        fontFamily: 'Playfair Display, serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Luxury Velvet Seating',
            subtitle: 'Elegant couches and velvet armchairs for elite homes.',
            image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200',
          },
          styles: {
            paddingTop: '100px',
            paddingBottom: '100px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'The Premium Collection',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '✨ Deluxe Design: Free white-glove inside delivery on couch configurations',
        announcement_bar_active: 'true',
        about_title: 'Architectural Luxury',
        about_tagline: 'Plush velvet textures and brass support details',
        about_content: 'True luxury lies in materials. We combine Italian velvet upholstery with custom brass hardware to create furniture that serves as a masterpiece in your home.',
      },
    },
  },
  beauty: {
    organic: {
      theme: {
        primaryColor: '#BE185D',
        secondaryColor: '#10B981',
        backgroundColor: '#FFF1F2',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: '100% Organic Beauty Oils',
            subtitle: 'Nourish your skin with natural botanical seed extracts.',
            image_url: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Botanical Essentials',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🌸 Clean Skincare: Free cotton pads with any organic oil blend',
        announcement_bar_active: 'true',
        about_title: 'Clean Cosmetics',
        about_tagline: 'Cruelty-free formulas without synthetic parabens',
        about_content: 'Your skin is permeable, so we keep cosmetics pure. We source clean botanicals to formulate nourishing skincare products that enhance your natural glow.',
      },
    },
    luxury: {
      theme: {
        primaryColor: '#831843',
        secondaryColor: '#D97706',
        backgroundColor: '#FDF8F7',
        fontFamily: 'Lora, serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Premium Anti-Aging Serum',
            subtitle: 'Clinically tested peptide formulas for timeless radiance.',
            image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200',
          },
          styles: {
            paddingTop: '90px',
            paddingBottom: '90px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Premium Beauty Collection',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '✨ Beauty Upgrade: Complimentary gold massage roller with any elite serum package',
        announcement_bar_active: 'true',
        about_title: 'Radiance Science',
        about_tagline: 'Scientifically backed formulas for healthy cells',
        about_content: 'We bridge advanced biotechnology with luxury skincare. Our formulas feature safe, active peptides designed to target fine lines and improve skin elasticity.',
      },
    },
    glam: {
      theme: {
        primaryColor: '#BE185D',
        secondaryColor: '#EC4899',
        backgroundColor: '#FFF5F7',
        fontFamily: 'Outfit, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'High-Pigment Glam Palette',
            subtitle: 'Vibrant cosmetics designed for professional performance.',
            image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Glam Favorites',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '💄 Lip Special: Get a free smudge-proof liner with any matte lipstick',
        announcement_bar_active: 'true',
        about_title: 'Express Yourself',
        about_tagline: 'Professional grade pigment for makeup artists',
        about_content: 'Makeup is an extension of personality. We formulate rich, vibrant pigments that hold all day, allowing you to create stunning, camera-ready glam looks.',
      },
    },
  },
  pharmacy: {
    clinical: {
      theme: {
        primaryColor: '#0891B2',
        secondaryColor: '#059669',
        backgroundColor: '#F0FDFA',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Trusted OTC Meds & Diagnostics',
            subtitle: 'Safe, certified health essentials delivered promptly.',
            image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'OTC Essentials',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '💊 Diagnostics Special: Free home sugar test strip pack with any blood monitor',
        announcement_bar_active: 'true',
        about_title: 'Clinical Standards',
        about_tagline: 'Certified medical supply storage facilities',
        about_content: 'Your wellness is our top priority. We verify all distributors and store medicine in temperature-controlled warehouses to guarantee formula integrity.',
      },
    },
    wellness: {
      theme: {
        primaryColor: '#0D9488',
        secondaryColor: '#EAB308',
        backgroundColor: '#F0FDF4',
        fontFamily: 'Outfit, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Daily Vitamins & Dietary Supplements',
            subtitle: 'Nourish your cells with active mineral complexes.',
            image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Vitamins & Minerals',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🔋 Immunity Boost: Buy 2 multivitamin bottles, save 10%',
        announcement_bar_active: 'true',
        about_title: 'Wellness Philosophy',
        about_tagline: 'Clean ingredients supporting active daily lives',
        about_content: 'Preventative care is the foundation of long-term health. We offer clean, filler-free dietary supplements that support energy, focus, and natural defense lines.',
      },
    },
    express: {
      theme: {
        primaryColor: '#2563EB',
        secondaryColor: '#EF4444',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'First Aid & Family Relief Express',
            subtitle: 'Instant diagnostics and rapid healing aids.',
            image_url: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=1200',
          },
          styles: {
            paddingTop: '75px',
            paddingBottom: '75px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Express First Aid',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🚨 Express Delivery: Bandages & pain relief packs delivered in 30 minutes!',
        announcement_bar_active: 'true',
        about_title: 'Express Supply',
        about_tagline: 'Emergency home supplies on call',
        about_content: 'Accidents happen without warning. We stock local neighborhood nodes with bandages, burns dressings, and basic fever remedies for immediate dispatch.',
      },
    },
  },
  petstore: {
    playful: {
      theme: {
        primaryColor: '#D97706',
        secondaryColor: '#2563EB',
        backgroundColor: '#FEF3C7',
        fontFamily: 'Quicksand, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Interactive Toys & Tasty Chews',
            subtitle: 'Keep your pets active, healthy, and happy.',
            image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Dog & Cat Favorites',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🐾 Playful Special: Get a free squeaker ball with any order over $35!',
        announcement_bar_active: 'true',
        about_title: 'Our Mission',
        about_tagline: 'For tail-wagging happiness & purrs of joy',
        about_content: 'Pets are part of the family. We formulate durable rubber toys and raw treats designed to stimulate pet intellect, keeping them physically active and healthy.',
      },
    },
    premium: {
      theme: {
        primaryColor: '#1E293B',
        secondaryColor: '#D97706',
        backgroundColor: '#FAFAF7',
        fontFamily: 'Inter, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Premium Grain-Free Pet Nutrition',
            subtitle: 'High-protein diet formulated by veterinary dietitians.',
            image_url: 'https://images.unsplash.com/photo-1589924691106-07a3c8248357?q=80&w=1200',
          },
          styles: {
            paddingTop: '85px',
            paddingBottom: '85px',
            textAlign: 'left',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Premium Nutrition Bags',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🥩 Nutrition Event: Free measuring cup included with any kibble bag purchase',
        announcement_bar_active: 'true',
        about_title: 'Veterinary Choice',
        about_tagline: 'Premium meat proteins with zero fillers',
        about_content: 'A healthy coat begins with clean protein. We source salmon, venison, and organic chicken without corn, soy, or wheat fillers to ensure robust gut health in pets.',
      },
    },
    nature: {
      theme: {
        primaryColor: '#16A34A',
        secondaryColor: '#D97706',
        backgroundColor: '#F0FDF4',
        fontFamily: 'Outfit, sans-serif',
      },
      homepage: [
        {
          type: 'HERO_BANNER',
          content: {
            title: 'Biodegradable Pet Accessories',
            subtitle: 'Eco-friendly hemp collars and wooden scratchers.',
            image_url: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?q=80&w=1200',
          },
          styles: {
            paddingTop: '80px',
            paddingBottom: '80px',
            textAlign: 'center',
          },
        },
        {
          type: 'PRODUCT_GRID',
          content: {
            title: 'Eco Friendly Toys',
            limit: 4,
          },
          styles: {
            paddingTop: '40px',
            paddingBottom: '40px',
          },
        },
      ],
      settings: {
        announcement_bar: '🌿 Green Pets: Free compostable pet waste bags with any eco collar',
        announcement_bar_active: 'true',
        about_title: 'Eco Pet Care',
        about_tagline: 'Sustainable fibers for pet comfort',
        about_content: 'We design pet equipment using clean, renewable materials. From organic cotton fabrics to natural sisal ropes, we guarantee your pet accessories are safe for the earth.',
      },
    },
  },
};
