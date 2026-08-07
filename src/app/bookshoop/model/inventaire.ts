import { Boutique } from "./boutique";
import { Categorie } from "./categorie";
import { Depot } from "./depot";
import { Produit } from "./produit";

export interface Inventaire {
     id?: number;
  produit: Produit;
  quantite: number;
  prix: number;
  total: number;
  dateInventaire?: Date;
  boutique?: Boutique;
  depot?: Depot;
  categorie?: Categorie;
}
