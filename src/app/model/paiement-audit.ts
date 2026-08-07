export interface PaiementAudit {
     id: number;
  versementId: number;
  factureId: number;
  clientId: number;
  montantVersement: number;
  montantFacture: number;
  soldeRestant: number;
  modePaiement: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  dateCreation: Date;
}

