import { CategorieNotification } from "../enums/CategorieNotification";
import { TypeNotification } from "../enums/TypeNotification";

export interface NotificationEnvoiRequest {
  clientId: number;
  factureId?: number;
  versementId?: number;
  typeNotification: TypeNotification;
  categorie: CategorieNotification;
  titre?: string;
  message: string;
  messageHtml?: string;
  destinataire?: string;
  datePrevueEnvoi?: Date;
  priorite?: number;
}