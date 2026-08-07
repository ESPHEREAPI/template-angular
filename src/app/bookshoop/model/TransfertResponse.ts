import { Produit } from "./produit";

export interface TransfertResponse {
  transfertId: number;
  produit: Produit;
  
  source: {
    id: number;
    code: string;
    libelle: string;
    ville: string;
    type: string;
    stockFinal: number;
  };
  destination: {
    id: number;
    code: string;
    libelle: string;
    ville: string;
    type: string;
    stockFinal: number;
  };
  quantite: number;
  valeurEstimation: number;
  dateTransfert: Date;
  message: string;
  status: string;
}