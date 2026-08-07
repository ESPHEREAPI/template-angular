import { Customer } from "./customer";
import { Sale } from "./sale";

export interface Invoice {
     id?: number;
  invoiceNumber: string;
  sale: Sale;
  saleId: number;
  customer?: Customer;
  customerId?: number;
  issueDate: Date;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
