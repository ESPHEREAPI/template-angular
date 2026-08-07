import { FactureItemRequest } from "./FactureItemRequest";

export interface FactureCreateRequest {
  clientId: number;
  dateFacture: Date;
  dateEcheance: Date;
  delaiPaiement?: number;
  conditionsPaiement?: string;
  remarques?: string;
  tauxRemiseGlobale?: number;
  accompte?: number;
  items: FactureItemRequest[];
  username: string;
  boutiqueid?:number;
}