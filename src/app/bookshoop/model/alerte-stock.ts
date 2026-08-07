import { TypeAlerte } from "../enums/TypeAlerte ";

export interface AlerteStock {
     id: number;
  pointVenteId: number;
  produitId: number;
  type: TypeAlerte;
  seuil: number;
  quantiteActuelle: number;
  message: string;
  actif: boolean;
  dateCreation: Date;
  dateResolution?: Date;

}
