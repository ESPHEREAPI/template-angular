import { Categorie } from "./categorie";

export interface Specifique {
  id?: number;
  code?: string;
  libelle: string;
  // Categorie a laquelle s'applique cette specification (ex. "Auteur" pour
  // "Livres") - absent/null = s'applique a toutes les categories.
  categorie?: Categorie | null;
  categorieId?: number | null;
}
