import { FactureSummaryForHistorique } from "./FactureSummaryForHistorique";
import { VersementSummary } from "./VersementSummary";

export interface HistoriquePaiementClient {
  clientId: number;
  clientNom: string;
  clientCode: string;
  totalFactures: number;
  montantTotalFactures: number;
  montantTotalVersements: number;
  montantRestant: number;
  tauxRecouvrement: number;
  versements: VersementSummary[];
  factures: FactureSummaryForHistorique[];
}