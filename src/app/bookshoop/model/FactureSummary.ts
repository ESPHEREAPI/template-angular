import { StatutFacture } from "../enums/StatutFacture";
import { Client } from "./client";

export interface FactureSummary {
  id: number;
  numeroFacture: string;
  dateFacture: Date;
  dateEcheance: Date;
  client: Client;
  totalTtc: number;
  montantPaye: number;
  soldeRestant: number;
  statut: StatutFacture;
  joursRetard?: number;
}