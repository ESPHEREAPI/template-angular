import { Supplier } from "./supplier";

export interface Product {
    id?: number;
  name: string;
  description?: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  image?: string;
  barcode?: string;
  supplier?: Supplier;
  supplierId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
