export interface Shop {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  status: 'ACTIVE' | 'SUSPENDED';
  ownerName: string;
  ownerEmail: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TenantRequest {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  category?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TenantConfig {
  id: string;
  domain: string;
  themeColors: {
    primary: string;
    secondary: string;
  };
}
