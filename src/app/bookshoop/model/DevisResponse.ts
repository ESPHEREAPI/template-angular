import { Devis } from "./devis";

export interface DevisResponse {
  content: Devis[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
