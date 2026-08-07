import { CategorieNotification } from "../enums/CategorieNotification";
import { StatutNotification } from "../enums/StatutNotification";
import { TypeNotification } from "../enums/TypeNotification";

export interface NotificationSummary {
  id: number;
  typeNotification: TypeNotification;
  typeNotificationLibelle: string;
  categorie: CategorieNotification;
  categorieLibelle: string;
  titre?: string;
  destinataire: string;
  dateCreation: Date;
  dateEnvoi?: Date;
  statut: StatutNotification;
  statutLibelle: string;
  clientNom: string;
  tentatives: number;
}