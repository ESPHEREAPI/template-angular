import { Annee } from "./annee";
import { Depot } from "./depot";

export interface MargeVenteFilter {
     annee?: Annee;
  //mois?: Mois;
  date?: Date;
  depot?: Depot;
  debut?:Date,
  fin:Date,
  position: number; // 1 = jour, 2 = mois

}
