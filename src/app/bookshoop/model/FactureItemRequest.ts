export interface FactureItemRequest {
  produitId: number;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  tauxRemise?: number;
  typeRemise?: 'POURCENTAGE' | 'MONTANT_FIXE';
  commentaire?: string;
}