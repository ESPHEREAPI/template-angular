import { Devis } from "./devis";
import { Facture } from "./facture";
import { VersementClient } from "./versement-client";

export interface Client {
    id?: number;
  code: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  region: string;
  bp?: string;
  fax?: string;
  quartier?: string;
  indicatifPays?: string;
 statut?:'ACTIF' | 'EN_ATTENTE' | 'INACTIF';
  fidelite: boolean;
  devis: Devis[];
  factures: Facture[];
  versements: VersementClient[];
}
