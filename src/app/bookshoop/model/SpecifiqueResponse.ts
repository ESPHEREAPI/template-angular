import { Specifique } from "./specifique";

export interface SpecifiqueResponse {
  content: Specifique[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
