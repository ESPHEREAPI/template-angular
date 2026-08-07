import { User } from "./user";

export interface AccountCreationResult {
  user: User;
  /** Renseigne uniquement si aucun mot de passe n'a ete fourni a la creation. */
  generatedPassword?: string;
}
