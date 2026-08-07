import { Annee } from "./annee";
import { Mois } from "./mois";
import { Person } from "./person";

export interface CaisseFilter {
    annee?: Annee;
  mois?: Mois;
    caissier?: Person;
    date?: Date;
}
