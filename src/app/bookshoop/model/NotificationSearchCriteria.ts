import { CategorieNotification } from "../enums/CategorieNotification";
import { StatutNotification } from "../enums/StatutNotification";
import { TypeNotification } from "../enums/TypeNotification";

export interface NotificationSearchCriteria {
  clientId?: number;
  factureId?: number;
  typeNotification?: TypeNotification;
  categorie?: CategorieNotification;
  statut?: StatutNotification;
  dateCreationDebut?: Date;
  dateCreationFin?: Date;
  destinataire?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}