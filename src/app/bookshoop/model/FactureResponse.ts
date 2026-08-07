import { Facture } from "./facture";

export interface FactureResponse extends Facture {
  messageRetour?: string;
}