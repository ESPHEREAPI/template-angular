import { TypeCommerce } from "./type-commerce";

export interface Compagnie {
  id?: number;
  nom: string;
  // Identifiant de l'URL publique de la boutique en ligne (voir
  // /shop/:code cote storefront) - choisi par l'admin de compagnie,
  // unique tous compagnies confondues (voir CompagnieService.genererCodeUnique
  // cote backend, qui ajoute un suffixe -2/-3... en cas de collision).
  code?: string;
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
