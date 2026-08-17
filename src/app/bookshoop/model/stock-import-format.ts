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
}

export interface ApercuImportStock {
  lignes: LigneApercuImportStock[];
  hasErreurs: boolean;
}
