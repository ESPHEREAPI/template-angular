import { Categorie } from "./categorie";

export interface CategorieResponse {
  content: Categorie[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
