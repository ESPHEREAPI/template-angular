import { Boutique } from "./boutique";
import { Fournisseur } from "./fournisseur";

export interface Depot {
     id?: number;
     code :string;
  libelle: string;
  boutique: Boutique | null;
  fournisseur?: Fournisseur;
  actif: boolean;
  
}
