export interface Barcodeproduit {
  id?: number;
  codeBard: string;
  /** true = pas encore synchronisee (creation en attente) - voir CodeBareOfflineService. */
  pending?: boolean;
  prixArticles?: {
    id?: number;
    pointVente?: {
      produit?: {
        id?: number;
        libelle?: string;
        reference?: string;
      };
    };
  };
}
