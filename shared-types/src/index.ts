export interface TenantConfig {
  id: string;
  domain: string;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

export interface WidgetPayload {
  type: 'HERO' | 'GRID';
  content: any;
}