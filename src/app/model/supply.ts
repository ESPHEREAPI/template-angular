import { Supplier } from "./supplier";
import { SupplyProduct } from "./supply-product";

export interface Supply {
    id?: number;
  reference: string;
  supplier: Supplier;
  supplierId: number;
  products: SupplyProduct[];
  totalAmount: number;
  status: 'pending' | 'received' | 'cancelled';
  receivedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
