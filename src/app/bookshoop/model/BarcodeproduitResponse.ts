import { Barcodeproduit } from "./barcodeproduit";

export interface BarcodeproduitResponse {
  content: Barcodeproduit[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
