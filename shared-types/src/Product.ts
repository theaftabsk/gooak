export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  parentId?: string;
  shopId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  description: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  trackStock: boolean;
  stockQty: number;
  lowStockAt?: number;
  shopId: string;
  categoryId?: string;
  imageUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  variants?: ProductVariant[];
  category?: Category;
}

export interface ProductVariant {
  id: string;
  productId: string;
  label: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stockQty: number;
  lowStockAt?: number;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductReview {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  title?: string;
  body?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date | string;
}
