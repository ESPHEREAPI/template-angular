import { StatutFacture } from "../enums/StatutFacture";

export interface FactureSearchCriteria {
  numeroFacture?: string;
  clientId?: number;
  statut?: StatutFacture;
  dateFactureDebut?: Date;
  dateFactureFin?: Date;
  dateEcheanceDebut?: Date;
  dateEcheanceFin?: Date;
  enRetard?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  boutiqueid?:number;
}