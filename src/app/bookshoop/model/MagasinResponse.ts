import { Magasin } from "./Magasin";

export interface MagasinResponse {
  content: Magasin[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
