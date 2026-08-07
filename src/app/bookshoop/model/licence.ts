export interface Licence {
  id?: number;
  compagnieId: number;
  compagnieNom?: string;
  statut?: string;
  dateDebut?: Date;
  dateExpiration?: Date;
  maxUtilisateurs?: number;
  maxBoutiques?: number;
  modules?: string[];
  cle?: string;
  createdBy?: string;
  createdAt?: Date;
  revokedBy?: string;
  dateRevocation?: Date;
  essai?: boolean;
}
