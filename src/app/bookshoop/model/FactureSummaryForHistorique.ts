export interface FactureSummaryForHistorique {
  id: number;
  numeroFacture: string;
  dateFacture: Date;
  montantTTC: number;
  montantPaye: number;
  montantRestant: number;
  statut: string;
}