import { EtatDevis } from "../bookshoop/enums/EtatDevis";

 export interface FiltrageDevis {
  statut?: EtatDevis;
  clientId?: number;
  dateDebut?: Date;
  dateFin?: Date;
  montantMin?: number;
  montantMax?: number;
  searchText?: string;
  page?: number;
  pageSize?: number;
}