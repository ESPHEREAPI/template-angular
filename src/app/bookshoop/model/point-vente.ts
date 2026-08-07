import { Boutique } from "./boutique";
import { Produit } from "./produit";

export interface PointVente {
    id?: number;
  produit: Produit;
  entreeProduit: number;
  stockFinalTheorie: number;
  stockInitial: number;
  sortiProduit: number;
  boutique: Boutique;
  depotid?: number;
  prix?:number;
}
