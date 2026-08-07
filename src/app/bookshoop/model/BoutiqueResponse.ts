import { Boutique } from "./boutique";

export interface BoutiqueResponse {
  content: Boutique[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}