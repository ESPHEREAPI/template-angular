

import { StatutFacture } from "../enums/StatutFacture";
import { Client } from "./client";
import { FactureItem } from "./facture-item";
import { Produit } from "./produit";
import { VersementClient } from "./versement-client";


export interface Facture {
     id?: number;
  numeroFacture: string;
  dateFacture: Date;
  clientId: number;
  client: Client;
  devisId?: number;
  items: FactureItem[];
  versements?: VersementClient[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  montantDejaPaye: number;
  modePaiement?: string;
  dateCreation: Date;
  dateModification?: Date;
  dateEcheance: Date;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  montantRestant: number;
  statut: StatutFacture;
  usernameCreate?: string;
  remarques?: string;
  conditionsPaiement?: string;
  delaiPaiement?: number;
  delaiPaiementJours?:number
  tauxRemiseGlobale?: number;
  montantRemiseGlobale?: number;
  accompte?: number;
  totalQuantite?: number;
  nombreLignes?: number;
  joursRetard?: number;
  dateValidation?: Date;
  dateAnnulation?: Date;
  motifAnnulation?: string;
  soldeRestant?:number;
  
}
