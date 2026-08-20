// Formes correspondant exactement aux DTOs publics du backend (voir
// EcomPublicController, CompagniePubliqueDTO/BoutiquePubliqueDTO/ArticlePublicDTO).

export interface BoutiquePublique {
  id: number;
  nom: string;
  quartier: string | null;
  principale: boolean;
}

export interface CompagniePublique {
  id: number;
  nom: string;
  code: string;
  logoChemin: string | null;
  boutiques: BoutiquePublique[];
}

export interface ArticlePublic {
  prixArticlesId: number;
  produitId: number;
  reference: string;
  libelle: string;
  description: string | null;
  photoName: string | null;
  categorieId: number | null;
  categorieLibelle: string | null;
  prixVenteNet: number;
  prixVenteTTC: number;
  remise: number;
  typePromotion: string;
  promotionActive: boolean;
  quantiteDisponible: number;
}

export interface ArticlesPage {
  content: ArticlePublic[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export interface CategoriePublique {
  id: number;
  libelle: string;
}
