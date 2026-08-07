export interface Photocopie {
  id?: number;
  libelle: string;
  montant: number;
  dateReception: string;
  boutiqueid: number;
  username?: string;
  commentaire?: string;
  entrepriseNom?: string;
  moisLibelle?: string;
}

export interface PhotocopieSummary {
  totalMontant: number;
  nombreEntrees: number;
  periodeDebut?: string;
  periodeFin?: string;
  montantMoyen: number;
  montantMin: number;
  montantMax: number;
}

export interface PhotocopiePage {
  content: Photocopie[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
