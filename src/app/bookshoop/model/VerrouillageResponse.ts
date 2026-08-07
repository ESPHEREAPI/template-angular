import { Verrouillage } from "./verrouillage";

export interface VerrouillageResponse {
  content: Verrouillage[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
