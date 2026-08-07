import { PrixArticles } from "./prix-articles";
import { Produit } from "./produit";

export interface CaisseItem {
 id?: number;
  article: Produit;
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
  remise?: number;
  typePaiement?: string;
   numeroTicket?: string;
}
