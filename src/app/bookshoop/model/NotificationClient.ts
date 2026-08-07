import { CategorieNotification } from "../enums/CategorieNotification";
import { StatutNotification } from "../enums/StatutNotification";
import { TypeNotification } from "../enums/TypeNotification";
import { NotificationClientInfo } from "./NotificationClientInfo";
import { NotificationFactureInfo } from "./NotificationFactureInfo";
import { NotificationVersementInfo } from "./NotificationVersementInfo";

export interface NotificationClient {
  id?: number;
  typeNotification: TypeNotification;
  categorie: CategorieNotification;
  titre?: string;
  message: string;
  messageHtml?: string;
  destinataire: string;
  nomDestinataire?: string;
  dateCreation?: Date;
  dateEnvoi?: Date;
  dateLecture?: Date;
  datePrevueEnvoi?: Date;
  statut: StatutNotification;
  tentatives?: number;
  maxTentatives?: number;
  codeReponse?: string;
  messageErreur?: string;
  idExterne?: string;
  client?: NotificationClientInfo;
  facture?: NotificationFactureInfo;
  versement?: NotificationVersementInfo;
  priorite?: number;
  donneesSupplementaires?: string;
  usernameCreate?: string;
}