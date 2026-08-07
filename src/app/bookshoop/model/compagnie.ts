import { TypeCommerce } from "./type-commerce";

export interface Compagnie {
  id?: number;
  nom: string;
  typeCommerce?: TypeCommerce;
  actif?: boolean;
  dateCreation?: Date;
  adresse?: string;
  tel?: string;
  email?: string;
  capital?: string;
  numeroContribuable?: string;
  nui?: string;
  rccm?: string;
  siteWeb?: string;
  directeur?: string;
  logoChemin?: string;
  bp?: string;
  quartier?: string;
  ville?: string;
  adminUserName?: string;
  adminNom?: string;
  adminEmail?: string;
}
