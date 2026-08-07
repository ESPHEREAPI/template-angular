import { TypeCommerce } from "./type-commerce";

export interface CreateCompagnieRequest {
  nom: string;
  typeCommerce: TypeCommerce;
  adresse?: string;
  tel?: string;
  email?: string;

  /** Optionnel : si absent, le backend genere un identifiant automatiquement. */
  adminUserName?: string;
  adminFirstName?: string;
  adminLastname?: string;
  adminEmail?: string;
  /** Optionnel : si absent, le backend genere un mot de passe temporaire. */
  adminPassword?: string;
}
