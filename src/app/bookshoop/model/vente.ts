import { PaymentType } from "../enums/payment-type";
import { BonAchat } from "./bon-achat";
import { CaisseItem } from "./caisse-item";
import { Person } from "./person";

// Une ligne de paiement au sein d'une vente a paiement mixte (ex: espece +
// Orange Money, ou espece + bon d'achat). reference porte le code du bon
// d'achat quand typePaiement === 'BON_ACHAT'.
export interface LignePaiement {
  typePaiement: string;
  montant: number;
  reference?: string;
}

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
  paiements?: LignePaiement[];
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
