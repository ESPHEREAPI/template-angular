import { Categorie } from './categorie';

export interface MargeCible {
  id?: number;
  tauxCible: number;
  categorie?: Categorie;
}

export interface MargeCibleRequest {
  categorieId: number;
  tauxCible: number;
}
