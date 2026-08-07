import { StockFilter } from "./stock-filter";

export interface ExportParams {
    format: 'PDF' | 'EXCEL' | 'CSV';
  filtres?: StockFilter;
  colonnes?: string[];
  titre?: string;
  includeStatistiques?: boolean;
}
