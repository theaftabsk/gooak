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
  custom_sections?: any[];
}
