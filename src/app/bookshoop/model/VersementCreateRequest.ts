import { ModePaiement } from "../enums/ModePaiement";

export interface VersementCreateRequest {
  factureId: number;
  dateVersement: Date;
  montant: number;
  modePaiement: ModePaiement;
  referencePaiement?: string;
  banque?: string;
  numeroCompte?: string;
  remarques?: string;
  username: string;
}