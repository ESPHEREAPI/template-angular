export interface TypeDepense {
  id?: number;
  code: string;
  libelle: string;
}

export interface Charge {
  id?: number;
  montant: number;
  dateCharge: string;
  commentaire?: string;
  typeDepense?: TypeDepense;
}

export interface ChargeCreateRequest {
  boutiqueId: number;
  typeDepenseId: number;
  montant: number;
  dateCharge: string;
  commentaire?: string;
}
