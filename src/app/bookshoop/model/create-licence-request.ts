export interface CreateLicenceRequest {
  compagnieId: number;
  dateExpiration: Date;
  maxUtilisateurs: number;
  maxBoutiques: number;
  modules: string[];
}
