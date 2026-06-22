export class CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  short_desc?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  category_id?: string;
  brand_id?: string;
  status?: string;
  is_featured?: boolean;
  master_sku?: string;
  custom_sections?: any[];
  sort_order?: number;

  // Professional Retail DTO fields
  hsn_code?: string;
  youtube_url?: string;
  supplier_name?: string;
  supplier_cost?: number;
  supplier_link?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  allow_backorders?: boolean;
  visibility?: string;
  product_tags?: string[];
  label?: string;
  best_seller?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
  enable_reviews?: boolean;
  verified_only?: boolean;

  // Shopify-level extensions
  seo_keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  schema_markup?: any;
  is_digital?: boolean;
  download_url?: string;
  download_limit?: number;
  license_key?: string;
  flash_sale?: boolean;
  deal_of_the_day?: boolean;
  recommended?: boolean;
  recently_added?: boolean;

  // Relations DTO fields
  gallery?: any[];
  media?: any[];
  faqs?: any[];
  variants?: any[];
  specifications?: any[];
  collections?: string[]; // array of collection IDs
}
