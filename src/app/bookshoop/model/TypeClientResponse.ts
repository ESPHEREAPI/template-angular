import { TypeClient } from "./typeclient";

export interface TypeClientResponse {
  content: TypeClient[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
