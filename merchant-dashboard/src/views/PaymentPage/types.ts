export interface PaymentGateway {
  id: string;
  name: string;
  slug: 'cod' | 'razorpay' | 'phonepe' | string;
  is_active: boolean;
  config: Record<string, any>;
  sort_order: number;
}

export type ActiveView = 'list' | 'cod' | 'razorpay' | 'phonepe';
