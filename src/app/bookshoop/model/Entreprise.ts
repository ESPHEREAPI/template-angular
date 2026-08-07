import { Annee } from "./annee";

export interface CompagnieInfo {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  ville?: string;
}

export interface Entreprise {
  anneeId: number;
  compagnieId: number;
  directeur?: string;
  activite: string;
  conventionCollective: string;
  siteWeb?: string;
  actif: boolean;
  typeResponsable?: string;
  dateCreation: string; // Format: yyyy-MM-dd
  dateFinLicense?: string; // Format: yyyy-MM-dd
  annee: Annee;
  compagnie: CompagnieInfo;
}
