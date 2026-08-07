export interface EntrepriseRequest {
  anneeId: number;
  directeur?: string;
  activite: string;
  conventionCollective: string;
  siteWeb?: string;
  actif: boolean;
  typeResponsable?: string;
  dateCreation: string;
  dateFinLicense?: string;
}