export interface RecuPaiementDTO {
  versementId: number;
  numeroVersement: string;
  numeroFacture: string;
  clientNom: string;
  dateVersement: Date;
  montant: number;
  modePaiement: string;
  referencePaiement?: string;
  montantEnLettres: string;
  pdfBase64?: string;
  urlPdf?: string;
}