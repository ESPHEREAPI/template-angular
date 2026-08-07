import { Produit } from "./produit";

export interface Commande {
    id?: number;
  dateReception: Date;
  numeroRepartition: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  depotid?: number;
  fournisseurid?:number
  produitid?: number;
  barcode?:string;
  usercreate?:string;
  tva?:number;
  remise?:number;
}
