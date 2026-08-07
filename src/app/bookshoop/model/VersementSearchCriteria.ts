import { ModePaiement } from "../enums/ModePaiement";

export interface VersementSearchCriteria {
  numeroVersement?: string;
  factureId?: number;
  clientId?: number;
  modePaiement?: ModePaiement;
  statut?: string;
  dateVersementDebut?: Date;
  dateVersementFin?: Date;
  montantMin?: number;
  montantMax?: number;
  referencePaiement?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  boutiqueid?:number;
}