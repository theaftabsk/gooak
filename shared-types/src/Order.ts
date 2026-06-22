export interface Order {
  id: string;
  shopId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: 'COD' | 'RAZORPAY' | 'STRIPE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  items?: OrderItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  qty: number;
  price: number;
  totalPrice: number;
  productName: string;
  variantLabel: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
