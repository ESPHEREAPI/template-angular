import { FactureItemRequest } from "./FactureItemRequest";

export interface FactureUpdateRequest {
  id: number;
  dateFacture?: Date;
  dateEcheance?: Date;
  conditionsPaiement?: string;
  remarques?: string;
  tauxRemiseGlobale?: number;
  items?: FactureItemRequest[];
  username: string;
}