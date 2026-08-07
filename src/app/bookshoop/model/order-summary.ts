import { ItemProduct } from "./Item-Product";

export interface OrderSummary {
    id: string;
  items: ItemProduct[];
  total: number;
  itemCount: number;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentMethod?: string;
    notes?: string;
  };
  shippingInfo?: {
    method: string;
    cost: number;
    estimatedDelivery: Date;
    trackingNumber?: string;
  };
  paymentInfo?: {
    method: string;
    transactionId?: string;
    paidAt?: Date;
    amount: number;
  };
  discounts?: {
    type: 'percentage' | 'fixed';
    value: number;
    code?: string;
    description: string;
  }[];
  taxes?: {
    rate: number;
    amount: number;
  };
  metadata?: {
    source: 'web' | 'mobile' | 'admin';
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}
