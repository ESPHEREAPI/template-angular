
import { FactureItemSnapshot } from "./facture-item-snapshot";
import { Produit } from "./produit";


export interface FactureItem {
     id?: number;
  produitId: number;
  produit: Produit;
  quantite: number;
  prixUnitaire: number;
  remisePercent: number;
  snapshot: FactureItemSnapshot;
  produitCodeSnapshot: string;
  produitLibelleSnapshot: string;
  description?: string;
  produitReferenceSnapshot?: string;
  prixUnitaireHT: number;
  tauxRemise?: number;
  montantRemise?: number;
  typeRemise?: 'POURCENTAGE' | 'MONTANT_FIXE';
  tauxTVA: number;
  montantTVA: number;
  montantHT: number;
  montantTTC: number;
  prixUnitaireTTC: number;
  ordre?: number;
  commentaire?: string;

}
