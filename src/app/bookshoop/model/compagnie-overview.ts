export interface CompagnieOverview {
  compagnieId: number;
  nom: string;
  typeCommerce?: string;
  actif: boolean;
  dateCreation?: string;
  nombreUtilisateurs: number;
  statutLicence: string;
  dateExpirationLicence?: string;
}
