import { VersementCreateRequest } from "./VersementCreateRequest";

export interface VersementMultipleRequest {
  factureId: number;
  versements: VersementCreateRequest[];
  username: string;
}