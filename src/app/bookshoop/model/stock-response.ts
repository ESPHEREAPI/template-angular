import { StockItem } from "./stock-item";

export interface StockResponse {
    data: StockItem[];
  totalRecords: number;
  success: boolean;
  message?: string;
}
