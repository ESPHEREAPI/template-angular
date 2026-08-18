export type ChampImportStock = 'REFERENCE' | 'PRODUIT' | 'CATEGORIE' | 'PRIX_VENTE' | 'PRIX_ACHAT' | 'BOUTIQUE' | 'QUANTITE';

export const LIBELLE_CHAMP_IMPORT_STOCK: Record<ChampImportStock, string> = {
  REFERENCE: 'Référence',
  PRODUIT: 'Produit',
  CATEGORIE: 'Catégorie',
  PRIX_VENTE: 'Prix Vente',
  PRIX_ACHAT: 'Prix Achat',
  BOUTIQUE: 'Boutique',
  QUANTITE: 'Quantité'
};

export interface StockImportFormat {
  colonnes: ChampImportStock[];
}

export type ModeRestauration = 'AJOUT' | 'REMPLACEMENT';

export interface LigneApercuImportStock {
  ligneNo: number;
  reference: string;
  boutiqueNom: string;
  ancienneQuantite: number | null;
  nouvelleQuantite: number | null;
  erreur: string | null;
  // true si ce produit n'existe pas encore : sera cree (avec son point de
  // vente) au lieu d'une simple mise a jour de stock.
  nouveauProduit: boolean;
  // true si ce produit existe deja au catalogue mais n'a encore aucun point
  // de vente dans cette boutique precise (catalogue partage entre
  // boutiques) : un nouveau point de vente sera cree, sans recreer le
  // produit. Toujours vrai quand nouveauProduit l'est aussi.
  nouveauPointVente: boolean;
}

export interface ApercuImportStock {
  lignes: LigneApercuImportStock[];
  hasErreurs: boolean;
}
