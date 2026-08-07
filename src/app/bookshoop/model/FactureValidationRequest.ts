export interface FactureValidationRequest {
  factureId: number;
  dateValidation?: Date;
  remarques?: string;
  username: string;
}