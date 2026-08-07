import { Customer } from "./customer";
import { SaleProduct } from "./sale-product";

export interface Sale {
    id?: number;
  reference: string;
  customer?: Customer;
  customerId?: number;
  products: SaleProduct[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'other';
  paymentStatus: 'paid' | 'pending' | 'cancelled';
  seller: string;
  createdAt?: Date;
}
