import { Ville } from "./ville";

export interface VilleResponse {
  content: Ville[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}