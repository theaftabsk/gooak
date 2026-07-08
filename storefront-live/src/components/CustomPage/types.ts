export type Section =
  | { type: 'hero';                data: HeroData }
  | { type: 'rich_text';           data: RichTextData }
  | { type: 'image_text';          data: ImageTextData }
  | { type: 'cards';               data: CardsData }
  | { type: 'cta';                 data: CtaData }
  | { type: 'contact_form';        data: ContactFormData }
  | { type: 'announcement_bar';    data: AnnouncementBarData }
  | { type: 'banner_slider';       data: BannerSliderData }
  | { type: 'products_grid';       data: ProductsGridData }
  | { type: 'features_strip';      data: FeaturesStripData }
  | { type: 'about_section';       data: AboutSectionData };

export interface HeroData {
  title: string; subtitle?: string; bg_image?: string; bg_color?: string;
  button_label?: string; button_url?: string; title_font?: string; subtitle_font?: string;
}

export interface RichTextData { title?: string; html: string }

export interface ImageTextData {
  title?: string; text: string; image_url: string; image_side?: 'left' | 'right';
}

export interface CardsData {
  title?: string;
  items: { icon?: string; title: string; text: string; title_font?: string }[];
}

export interface CtaData {
  title: string; subtitle?: string; button_label: string; button_url: string;
  bg_color?: string; button2_label?: string; button2_url?: string; title_font?: string;
}

export interface ContactFormData { title?: string; subtitle?: string }

export interface AnnouncementBarData { text: string; active?: boolean }

export interface BannerSlide {
  title?: string; subtitle?: string; image_url: string; link_url?: string;
  text_position?: string; title_font?: string; subtitle_font?: string; button_label?: string;
}
export interface BannerSliderData { banners?: BannerSlide[] }

export interface ProductsGridData {
  title?: string; badge?: string; subtitle?: string; limit?: number;
  view_all_url?: string; view_all_label?: string; columns?: 3 | 4;
}

export interface FeatureItem { emoji: string; title: string; desc: string; title_font?: string }
export interface FeaturesStripData { items?: FeatureItem[] }

export interface AboutValue { icon: string; label: string; desc: string }
export interface AboutSectionData {
  title?: string; content?: string; tagline?: string; image_url?: string;
  values?: AboutValue[]; button_label?: string; button_url?: string; title_font?: string;
}
