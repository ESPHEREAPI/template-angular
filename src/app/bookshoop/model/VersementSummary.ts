import { ModePaiement } from "../enums/ModePaiement";
import { StatutVersement } from "../enums/StatutVersement";

export interface VersementSummary {
  id: number;
  numeroVersement: string;
  dateVersement: Date;
  montant: number;
  modePaiement: ModePaiement;
  modePaiementLibelle: string;
  referencePaiement?: string;
  statut: StatutVersement;
  statutLibelle: string;
  clientNom: string;
  factureNumero: string;
}