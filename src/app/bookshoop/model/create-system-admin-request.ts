export interface CreateSystemAdminRequest {
  /** Optionnel : si absent, le backend genere un identifiant automatiquement. */
  userName?: string;
  firstName?: string;
  lastname?: string;
  email?: string;
  tel?: string;
  /** Optionnel : si absent, le backend genere un mot de passe temporaire. */
  password?: string;
}
