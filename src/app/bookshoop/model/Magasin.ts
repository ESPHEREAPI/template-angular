import { Boutique } from "./boutique";
import { Ville } from "./ville";

export type TypeMagasin = 'POINT_DE_VENTE' | 'DEPOT_CENTRAL';

export interface Magasin {
  id?: number;
  code: string;
  libelle: string;
  boutique?: Boutique;
  ville?: Ville;
  boutiqueId?: Boutique;
  villeid?: Ville;
  typeMagasin?: TypeMagasin;
}