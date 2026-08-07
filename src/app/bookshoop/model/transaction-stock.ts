import { Depot } from "./depot";
import { Produit } from "./produit";

export interface TransactionStock {
      id?: number;
  produit: Produit;
  source: Depot;
  destination: Depot;
  quantite: number;
  dateTransaction?: string;
}
