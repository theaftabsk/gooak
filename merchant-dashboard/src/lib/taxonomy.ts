export interface TaxonomyNode {
  name: string;
  slug: string;
  children?: TaxonomyNode[];
}

export const TAXONOMY: TaxonomyNode[] = [
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    children: [
      {
        name: 'Skin Care',
        slug: 'skin-care',
        children: [
          { name: 'Face Wash & Cleansers', slug: 'face-wash-cleansers' },
          { name: 'Moisturizers & Creams', slug: 'moisturizers-creams' },
          { name: 'Serums & Treatments', slug: 'serums-treatments' },
          { name: 'Sunscreen & SPF', slug: 'sunscreen-spf' },
          { name: 'Toners & Essences', slug: 'toners-essences' },
          { name: 'Exfoliators & Scrubs', slug: 'exfoliators-scrubs' },
          { name: 'Eye Creams & Serums', slug: 'eye-creams-serums' },
          { name: 'Face Masks & Packs', slug: 'face-masks-packs' },
          { name: 'Lip Care', slug: 'lip-care' },
          { name: 'Acne & Blemish Treatments', slug: 'acne-blemish-treatments' },
        ],
      },
      {
        name: 'Hair Care',
        slug: 'hair-care',
        children: [
          { name: 'Shampoo', slug: 'shampoo' },
          { name: 'Conditioner', slug: 'conditioner' },
          { name: 'Hair Oils & Serums', slug: 'hair-oils-serums' },
          { name: 'Hair Masks & Treatments', slug: 'hair-masks-treatments' },
          { name: 'Hair Styling', slug: 'hair-styling' },
          { name: 'Scalp Care', slug: 'scalp-care' },
        ],
      },
      {
        name: 'Body Care',
        slug: 'body-care',
        children: [
          { name: 'Body Lotion & Moisturizer', slug: 'body-lotion-moisturizer' },
          { name: 'Body Wash & Shower Gel', slug: 'body-wash-shower-gel' },
          { name: 'Body Scrubs', slug: 'body-scrubs' },
          { name: 'Deodorants & Antiperspirants', slug: 'deodorants-antiperspirants' },
          { name: 'Suncare & Tanning', slug: 'suncare-tanning' },
        ],
      },
      {
        name: 'Fragrances',
        slug: 'fragrances',
        children: [
          { name: 'Perfumes & Eau de Parfum', slug: 'perfumes-edp' },
          { name: 'Eau de Toilette', slug: 'eau-de-toilette' },
          { name: 'Body Mists & Sprays', slug: 'body-mists-sprays' },
        ],
      },
      {
        name: 'Makeup & Cosmetics',
        slug: 'makeup-cosmetics',
        children: [
          { name: 'Foundation & Concealer', slug: 'foundation-concealer' },
          { name: 'Lipstick & Lip Gloss', slug: 'lipstick-lip-gloss' },
          { name: 'Eyeshadow & Eyeliner', slug: 'eyeshadow-eyeliner' },
          { name: 'Mascara', slug: 'mascara' },
          { name: 'Blush, Bronzer & Highlighter', slug: 'blush-bronzer-highlighter' },
          { name: 'Nail Polish & Nail Care', slug: 'nail-polish-nail-care' },
          { name: 'Makeup Tools & Brushes', slug: 'makeup-tools-brushes' },
        ],
      },
      {
        name: 'Vitamins & Supplements',
        slug: 'vitamins-supplements',
        children: [
          { name: 'Multivitamins', slug: 'multivitamins' },
          { name: 'Protein & Sports Nutrition', slug: 'protein-sports-nutrition' },
          { name: 'Herbal & Ayurvedic', slug: 'herbal-ayurvedic' },
          { name: 'Collagen & Beauty Supplements', slug: 'collagen-beauty-supplements' },
        ],
      },
      {
        name: 'Oral Care',
        slug: 'oral-care',
        children: [
          { name: 'Toothpaste & Whitening', slug: 'toothpaste-whitening' },
          { name: 'Toothbrush & Floss', slug: 'toothbrush-floss' },
          { name: 'Mouthwash', slug: 'mouthwash' },
        ],
      },
    ],
  },
  {
    name: 'Apparel & Accessories',
    slug: 'apparel-accessories',
    children: [
      {
        name: "Women's Clothing",
        slug: 'womens-clothing',
        children: [
          { name: 'Tops & T-Shirts', slug: 'womens-tops-tshirts' },
          { name: 'Dresses & Skirts', slug: 'womens-dresses-skirts' },
          { name: 'Jeans & Trousers', slug: 'womens-jeans-trousers' },
          { name: 'Ethnic Wear', slug: 'womens-ethnic-wear' },
          { name: 'Activewear', slug: 'womens-activewear' },
          { name: 'Sleepwear & Loungewear', slug: 'womens-sleepwear' },
        ],
      },
      {
        name: "Men's Clothing",
        slug: 'mens-clothing',
        children: [
          { name: 'T-Shirts & Polos', slug: 'mens-tshirts-polos' },
          { name: 'Shirts', slug: 'mens-shirts' },
          { name: 'Jeans & Trousers', slug: 'mens-jeans-trousers' },
          { name: 'Ethnic Wear', slug: 'mens-ethnic-wear' },
          { name: 'Activewear', slug: 'mens-activewear' },
        ],
      },
      {
        name: 'Footwear',
        slug: 'footwear',
        children: [
          { name: "Women's Footwear", slug: 'womens-footwear' },
          { name: "Men's Footwear", slug: 'mens-footwear' },
          { name: 'Sports & Athletic Shoes', slug: 'sports-athletic-shoes' },
          { name: 'Sandals & Slippers', slug: 'sandals-slippers' },
        ],
      },
      {
        name: 'Bags & Luggage',
        slug: 'bags-luggage',
        children: [
          { name: 'Handbags & Purses', slug: 'handbags-purses' },
          { name: 'Backpacks', slug: 'backpacks' },
          { name: 'Travel Bags & Suitcases', slug: 'travel-bags-suitcases' },
          { name: 'Wallets & Card Holders', slug: 'wallets-card-holders' },
        ],
      },
      {
        name: 'Jewellery & Watches',
        slug: 'jewellery-watches',
        children: [
          { name: 'Necklaces & Chains', slug: 'necklaces-chains' },
          { name: 'Earrings', slug: 'earrings' },
          { name: 'Rings & Bracelets', slug: 'rings-bracelets' },
          { name: 'Watches', slug: 'watches' },
        ],
      },
    ],
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    children: [
      {
        name: 'Mobile & Tablets',
        slug: 'mobile-tablets',
        children: [
          { name: 'Smartphones', slug: 'smartphones' },
          { name: 'Tablets', slug: 'tablets' },
          { name: 'Mobile Accessories', slug: 'mobile-accessories' },
          { name: 'Cases & Covers', slug: 'cases-covers' },
        ],
      },
      {
        name: 'Audio',
        slug: 'audio',
        children: [
          { name: 'Earphones & Earbuds', slug: 'earphones-earbuds' },
          { name: 'Headphones', slug: 'headphones' },
          { name: 'Speakers & Soundbars', slug: 'speakers-soundbars' },
        ],
      },
      {
        name: 'Computers & Laptops',
        slug: 'computers-laptops',
        children: [
          { name: 'Laptops', slug: 'laptops' },
          { name: 'Desktops & Monitors', slug: 'desktops-monitors' },
          { name: 'Computer Accessories', slug: 'computer-accessories' },
        ],
      },
      {
        name: 'Cameras & Photography',
        slug: 'cameras-photography',
        children: [
          { name: 'Digital Cameras', slug: 'digital-cameras' },
          { name: 'Camera Accessories', slug: 'camera-accessories' },
        ],
      },
      {
        name: 'Wearables',
        slug: 'wearables',
        children: [
          { name: 'Smart Watches', slug: 'smart-watches' },
          { name: 'Fitness Bands', slug: 'fitness-bands' },
        ],
      },
    ],
  },
  {
    name: 'Food & Beverages',
    slug: 'food-beverages',
    children: [
      {
        name: 'Snacks & Packaged Food',
        slug: 'snacks-packaged-food',
        children: [
          { name: 'Chips & Namkeen', slug: 'chips-namkeen' },
          { name: 'Chocolates & Candies', slug: 'chocolates-candies' },
          { name: 'Biscuits & Cookies', slug: 'biscuits-cookies' },
          { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts' },
        ],
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        children: [
          { name: 'Tea & Coffee', slug: 'tea-coffee' },
          { name: 'Juices & Health Drinks', slug: 'juices-health-drinks' },
          { name: 'Energy & Sports Drinks', slug: 'energy-sports-drinks' },
        ],
      },
      {
        name: 'Health Foods',
        slug: 'health-foods',
        children: [
          { name: 'Organic & Natural Foods', slug: 'organic-natural-foods' },
          { name: 'Seeds & Superfoods', slug: 'seeds-superfoods' },
          { name: 'Protein Bars & Meal Replacements', slug: 'protein-bars-meal-replacements' },
        ],
      },
    ],
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    children: [
      {
        name: 'Kitchen & Dining',
        slug: 'kitchen-dining',
        children: [
          { name: 'Cookware & Bakeware', slug: 'cookware-bakeware' },
          { name: 'Kitchen Tools & Gadgets', slug: 'kitchen-tools-gadgets' },
          { name: 'Dinnerware & Serveware', slug: 'dinnerware-serveware' },
          { name: 'Storage & Organization', slug: 'kitchen-storage' },
        ],
      },
      {
        name: 'Bedding & Bath',
        slug: 'bedding-bath',
        children: [
          { name: 'Bed Sheets & Covers', slug: 'bed-sheets-covers' },
          { name: 'Pillows & Cushions', slug: 'pillows-cushions' },
          { name: 'Towels & Bath Accessories', slug: 'towels-bath-accessories' },
        ],
      },
      {
        name: 'Home Décor',
        slug: 'home-decor',
        children: [
          { name: 'Wall Art & Posters', slug: 'wall-art-posters' },
          { name: 'Candles & Diffusers', slug: 'candles-diffusers' },
          { name: 'Photo Frames & Albums', slug: 'photo-frames-albums' },
          { name: 'Clocks', slug: 'clocks' },
        ],
      },
      {
        name: 'Cleaning & Laundry',
        slug: 'cleaning-laundry',
        children: [
          { name: 'Cleaning Supplies', slug: 'cleaning-supplies' },
          { name: 'Detergents & Fabric Care', slug: 'detergents-fabric-care' },
        ],
      },
    ],
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    children: [
      {
        name: 'Exercise Equipment',
        slug: 'exercise-equipment',
        children: [
          { name: 'Yoga Mats & Accessories', slug: 'yoga-mats-accessories' },
          { name: 'Weights & Resistance', slug: 'weights-resistance' },
          { name: 'Cardio Equipment', slug: 'cardio-equipment' },
        ],
      },
      {
        name: 'Sportswear',
        slug: 'sportswear',
        children: [
          { name: 'Gym Wear', slug: 'gym-wear' },
          { name: 'Running Gear', slug: 'running-gear' },
          { name: 'Sports Shoes', slug: 'sports-shoes' },
        ],
      },
      {
        name: 'Outdoor & Adventure',
        slug: 'outdoor-adventure',
        children: [
          { name: 'Camping & Hiking', slug: 'camping-hiking' },
          { name: 'Cycling', slug: 'cycling' },
          { name: 'Water Sports', slug: 'water-sports' },
        ],
      },
    ],
  },
  {
    name: 'Baby & Kids',
    slug: 'baby-kids',
    children: [
      {
        name: 'Baby Care',
        slug: 'baby-care',
        children: [
          { name: 'Baby Skin Care', slug: 'baby-skin-care' },
          { name: 'Baby Hair Care', slug: 'baby-hair-care' },
          { name: 'Diapers & Wipes', slug: 'diapers-wipes' },
          { name: 'Baby Food & Nutrition', slug: 'baby-food-nutrition' },
        ],
      },
      {
        name: "Kids' Clothing & Accessories",
        slug: 'kids-clothing-accessories',
        children: [
          { name: "Boys' Clothing", slug: 'boys-clothing' },
          { name: "Girls' Clothing", slug: 'girls-clothing' },
          { name: 'School Bags & Accessories', slug: 'school-bags-accessories' },
        ],
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        children: [
          { name: 'Educational Toys', slug: 'educational-toys' },
          { name: 'Board Games & Puzzles', slug: 'board-games-puzzles' },
          { name: 'Action Figures & Dolls', slug: 'action-figures-dolls' },
        ],
      },
    ],
  },
  {
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    children: [
      {
        name: 'Dog Supplies',
        slug: 'dog-supplies',
        children: [
          { name: 'Dog Food & Treats', slug: 'dog-food-treats' },
          { name: 'Dog Grooming', slug: 'dog-grooming' },
          { name: 'Dog Accessories', slug: 'dog-accessories' },
        ],
      },
      {
        name: 'Cat Supplies',
        slug: 'cat-supplies',
        children: [
          { name: 'Cat Food & Treats', slug: 'cat-food-treats' },
          { name: 'Cat Grooming', slug: 'cat-grooming' },
          { name: 'Cat Accessories', slug: 'cat-accessories' },
        ],
      },
    ],
  },
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    children: [
      { name: 'Books', slug: 'books' },
      { name: 'Notebooks & Journals', slug: 'notebooks-journals' },
      { name: 'Art & Craft Supplies', slug: 'art-craft-supplies' },
      { name: 'Office Supplies', slug: 'office-supplies' },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    children: [
      { name: 'Car Accessories', slug: 'car-accessories' },
      { name: 'Bike Accessories', slug: 'bike-accessories' },
      { name: 'Car Care & Cleaning', slug: 'car-care-cleaning' },
    ],
  },
];

export interface FlatCategory {
  slug: string;
  name: string;
  path: string[];       // full path array e.g. ['Health & Beauty', 'Skin Care', 'Face Wash']
  pathSlugs: string[];  // slug path e.g. ['health-beauty', 'skin-care', 'face-wash-cleansers']
  label: string;        // display string e.g. 'Health & Beauty > Skin Care > Face Wash'
  depth: number;
  parentSlug?: string;
}

function flatten(nodes: TaxonomyNode[], path: string[] = [], pathSlugs: string[] = [], depth = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    const newPath = [...path, node.name];
    const newSlugs = [...pathSlugs, node.slug];
    result.push({
      slug: node.slug,
      name: node.name,
      path: newPath,
      pathSlugs: newSlugs,
      label: newPath.join(' > '),
      depth,
      parentSlug: pathSlugs[pathSlugs.length - 1],
    });
    if (node.children?.length) {
      result.push(...flatten(node.children, newPath, newSlugs, depth + 1));
    }
  }
  return result;
}

export const FLAT_TAXONOMY: FlatCategory[] = flatten(TAXONOMY);
