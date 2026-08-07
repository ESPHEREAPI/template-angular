import { Fournisseur } from "./fournisseur";

export interface FournisseurResponse {
  content: Fournisseur[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
