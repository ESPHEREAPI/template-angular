export interface FactureItemSnapshot {
     id: number;
  produitCodeSnapshot: string;
  produitLikelleSnapshot: string;
  quantite: number;
  prixUnitaireHT: number;
  prixUnitaireTTC: number;
  tauxTVA: number;
  montantHT: number;
  montantTTC: number;
  remisePercent: number;
}

