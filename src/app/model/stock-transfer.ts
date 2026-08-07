import { Product } from "./product";
import { StoreLocation } from "./store-location";

export interface StockTransfer {
     id?: number;
  productId: number;
  product?: Product;
  fromLocationId: number;
  fromLocation?: StoreLocation;
  toLocationId: number;
  toLocation?: StoreLocation;
  quantity: number;
  transferDate?: Date;
  notes?: string;
}
