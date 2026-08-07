import { Boutique } from "./boutique";
import { Ville } from "./ville";

export interface Magasin {
  id?: number;
  code: string;
  libelle: string;
  boutique?: Boutique;
  ville?: Ville;
  boutiqueId?: Boutique;
  villeid?: Ville;
}