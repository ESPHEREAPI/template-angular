export interface Barcodeproduit {
  id?: number;
  codeBard: string;
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
