import { Sale } from "./sale";

export interface CashRegister {
    id?: number;
  openingTime: Date;
  closingTime?: Date;
  initialAmount: number;
  finalAmount?: number;
  sales: Sale[];
  cashierId: number;
  cashierName: string;
  status: 'open' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}
