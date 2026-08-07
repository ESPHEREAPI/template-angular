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
}
