import { PaymentType } from "../enums/payment-type";
import { BonAchat } from "./bon-achat";
import { CaisseItem } from "./caisse-item";
import { Person } from "./person";

export interface Vente {
    id?: number;
  numeroTicket: string;
  date: Date;
  items: CaisseItem[];
  montantTotal: number;
  montantRecu: number;
  monnaieRendue: number;
  montantNet:number;
  typePaiement: string;
  client?: Person;
  remise?: number;
  bonAchat?: BonAchat;
  userinsert:string
  pointventeid?:number;
   statut: string//'EN_COURS' | 'TERMINEE' | 'ANNULEE';  // statut ajouté
   numerocommande?:number ;
   boutiqueid?:number;
   
 //  montantRemise:number;
  // montantFinal:number;
   //clientId:number;
}
