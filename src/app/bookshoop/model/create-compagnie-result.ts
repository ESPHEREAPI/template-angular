import { Compagnie } from "./compagnie";
import { User } from "./user";

export interface CreateCompagnieResult {
  compagnie: Compagnie;
  admin: User;
  /** Renseigne uniquement si aucun mot de passe n'a ete fourni pour l'admin compagnie. */
  generatedAdminPassword?: string;
}
