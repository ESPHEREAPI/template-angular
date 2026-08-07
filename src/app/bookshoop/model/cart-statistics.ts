import { Product } from "./product";

export interface CartStatistics {
     totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingProducts: { product: Product; totalSold: number; revenue: number }[];
  dailyStats: { date: string; orders: number; revenue: number }[];
  customerStats: { returning: number; new: number };
}
