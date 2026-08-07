
import { Client } from "./client";
import { DevisItem } from "./devis-item";
import { Facture } from "./facture";
import { Produit } from "./produit";

export interface Devis {
  id: number;
  dateDevis: Date;
  validite: number;
  clientId: number;
  client: Client;
  items: DevisItem[];
  total: number;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' | 'CONVERTI' | 'EXPIRE' | 'ANNULE';
  remarques?: string;
  facture?: Facture;
  dateExpiration: Date;
  tva_applicable?: boolean;
  taux?: number;
  tva?: number;
  produitId?: number;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  typeRemise: TypeRemise;
  totalLigne: number;
  searchTerm?: string;
  showDropdown?: boolean;
  filteredProduits?: Produit[];
  numeroDevis?:string;
  validiteJours?:number;
  tauxTVA?:number;
  montantHT?:number;
  totalTVA?:number;
  totalRemise?:number;
  appliquerTVA?:boolean;


}
type TypeRemise = 'POURCENTAGE' | 'MONTANT';
