import { PointVente } from "./point-vente";

export interface PrixArticles {
    id?: number;
  pointVente: PointVente;
  remise: number;
  tva: number;
  prixVenteNet: number;
  prixVenteTTC: number;
  quantite:number;
  actif: boolean;
  // Solde/promotion (voir CommandeController.definirPromotion) - AUCUNE par
  // defaut sur les lignes existantes.
  typePromotion?: 'AUCUNE' | 'PROMOTION' | 'SOLDE';
  dateDebutPromo?: string;
  dateFinPromo?: string;
}

export interface PromotionUpdate {
  prixVenteNet?: number;
  remise?: number;
  typePromotion?: 'AUCUNE' | 'PROMOTION' | 'SOLDE';
  dateDebutPromo?: string | null;
  dateFinPromo?: string | null;
}
