export type WidgetType =
  | 'HERO_BANNER'
  | 'DOUBLE_HERO'
  | 'PRODUCT_GRID'
  | 'TEXT_BLOCK'
  | 'PROMO_GRID'
  | 'TESTIMONIALS'
  | 'BEST_SELLERS'
  | 'CATEGORIES_LIST';

export interface BaseWidgetData {
  id: string;
  type: WidgetType;
  order: number;
  styles: {
    paddingTop: string;
    paddingBottom: string;
    customClasses?: string;
  };
}

export interface HeroBannerData extends BaseWidgetData {
  type: 'HERO_BANNER';
  content: {
    title: string;
    subtitle: string;
    backgroundImageUrl: string;
    buttonText: string;
    buttonLink: string;
  };
}

export interface ProductGridData extends BaseWidgetData {
  type: 'PRODUCT_GRID';
  content: {
    collectionId: string;
    itemsPerPage: number;
    showPrice: boolean;
  };
}

export interface TextBlockData extends BaseWidgetData {
  type: 'TEXT_BLOCK';
  content: {
    title: string;
    body: string;
    imageUrl?: string;
    imagePosition?: 'none' | 'left' | 'right' | 'top';
  };
}

export interface PromoGridData extends BaseWidgetData {
  type: 'PROMO_GRID';
  content: {
    title?: string;
    subtitle?: string;
    layout: string;
    cards: Array<{
      title: string;
      subtitle?: string;
      backgroundImageUrl: string;
      buttonText?: string;
      buttonLink?: string;
      bgColor?: string;
      textColor?: string;
      imgPosition?: string;
    }>;
  };
}

export interface TestimonialsData extends BaseWidgetData {
  type: 'TESTIMONIALS';
  content: {
    title: string;
    subtitle?: string;
    testimonials: Array<{
      id: string;
      name: string;
      role?: string;
      rating: number;
      text: string;
      avatarUrl?: string;
      date?: string;
    }>;
  };
}

export interface BestSellersData extends BaseWidgetData {
  type: 'BEST_SELLERS';
  content: {
    title: string;
    subtitle?: string;
    productIds: string[];
  };
}

export interface CategoriesListData extends BaseWidgetData {
  type: 'CATEGORIES_LIST';
  content: {
    title: string;
    subtitle?: string;
    showViewAll: boolean;
  };
}

export type WidgetLayout =
  | HeroBannerData
  | ProductGridData
  | TextBlockData
  | PromoGridData
  | TestimonialsData
  | BestSellersData
  | CategoriesListData;

export interface LivePageData {
  id: string;
  tenantId: string;
  slug: string;
  type: 'NORMAL' | 'COLLECTION';
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
  widgets: WidgetLayout[];
}
