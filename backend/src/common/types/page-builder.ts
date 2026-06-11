export type WidgetType = 'HERO_BANNER' | 'PRODUCT_GRID' | 'TEXT_BLOCK';

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
  };
}

export type WidgetLayout = HeroBannerData | ProductGridData | TextBlockData;

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
