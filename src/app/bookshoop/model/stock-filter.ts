export interface StockFilter {
    reference?: string;
  libelle?: string;

      globalFilter?: string;
  dateDebut?: string;
  dateFin?: string;
  stockMinimum?: number;
  stockMaximum?: number;
  pointVenteId?: number;
  produitId?: number;
  categoryId?: number;
}
