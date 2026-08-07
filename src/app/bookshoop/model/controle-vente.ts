export interface ControleVenteDTO {
  date: string;
  caisse: number;
  client: number;
  photocopies: number;
  resources: number;
  remise: number;
  total: number;
  totalNet: number;
  moisId: number;
  moisLibelle: string;
  anneeId: number;
  anneeValeur: number;
}

export interface ControleVenteSummaryDTO {
  totalCaisse: number;
  totalClient: number;
  totalPhotocopies: number;
  totalResources: number;
  totalRemises: number;
  totalGeneral: number;
  totalNet: number;
  nombreJours: number;
  moyenneJournaliere: number;
  periodeDebut?: string;
  periodeFin?: string;
}
