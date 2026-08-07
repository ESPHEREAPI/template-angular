import { PaymentType } from "../enums/payment-type";
import { CaisseItem } from "./caisse-item";

export interface Ticket {
     id?: number;
  numTicket: string;
  items: CaisseItem[];
  totalAmount: number;
  totalRecu: number;
  remise?: string;
  client?: string;
  typePaiement?: PaymentType;
  codeBonAchat?: string;
  montantBonAchat?: number;
  dateCreation: Date;
}
