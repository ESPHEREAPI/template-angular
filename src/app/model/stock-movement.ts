export interface StockMovement {
     id: number;
  type: 'ENTREE' | 'SORTIE_VENTE' | 'RETOUR' | 'INVENTAIRE' | 'AJUSTEMENT';
  quantite: number;
  produitId: number;
  pointVenteId: number;
  factureId?: number;
  motif: string;
  dateCreation: Date;
}
