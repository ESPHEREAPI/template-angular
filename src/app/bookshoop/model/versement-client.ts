import { ModePaiement } from "../enums/ModePaiement";
import { StatutVersement } from "../enums/StatutVersement";
import { Client } from "./client";
import { VersementFacture } from "./VersementFacture";

export interface VersementClient {
  id: number;
  factureId: number;
  clientId: number;
  date: Date;
  montant: number;
  referencePaiement?: string;
  numeroVersement: string;
  dateVersement: Date;
  modePaiement: ModePaiement;
  banque?: string;
  numeroCompte?: string;

  remarques?: string;
  dateEnregistrement?: Date;

  
  client: Client;
  facture: VersementFacture;
  statut: StatutVersement;
  dateValidation?: Date;
  dateAnnulation?: Date;

  motifAnnulation?: string;
  recuPaiement?: string;
  usernameCreate?: string;
  usernameValidation?: string;
  usernameAnnulation?: string; 
}
