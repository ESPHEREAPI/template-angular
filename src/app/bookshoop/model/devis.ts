
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
  // Champs plats renvoyes par DevisDTO une fois converti (voir DevisMapper) -
  // distincts du champ "facture" ci-dessus qui reflete la forme de l'entite
  // JPA, pas celle du DTO reellement recu du backend.
  factureId?: number;
  factureNumero?: string;
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
  // 'EN_LIGNE' = commande soumise par un client via le site public
  // e-commerce, 'INTERNE' = devis cree par le personnel. Voir CanalOrigine
  // cote backend et CommandesEnLigneComponent.
  canalOrigine?: 'INTERNE' | 'EN_LIGNE';
  canalOrigineLibelle?: string;

}
type TypeRemise = 'POURCENTAGE' | 'MONTANT';
