import { StatutFacture } from "./StatutFacture";

export enum ModePaiement {
  ESPECES = 'ESPECES',
  CHEQUE = 'CHEQUE',
  VIREMENT = 'VIREMENT',
  CARTE_BANCAIRE = 'CARTE_BANCAIRE',
  MOBILE_MONEY = 'MOBILE_MONEY',
  AUTRE = 'AUTRE'
}

export const ModePaiementLibelle: { [key in ModePaiement]: string } = {
  [ModePaiement.ESPECES]: 'Espèces',
  [ModePaiement.CHEQUE]: 'Chèque',
  [ModePaiement.VIREMENT]: 'Virement bancaire',
  [ModePaiement.CARTE_BANCAIRE]: 'Carte bancaire',
  [ModePaiement.MOBILE_MONEY]: 'Mobile Money',
  [ModePaiement.AUTRE]: 'Autre'
};

export const StatutFactureLibelle: { [key in StatutFacture]: string } = {
  [StatutFacture.BROUILLON]: 'Brouillon',
  [StatutFacture.NON_PAYEE]: 'Non payée',
  [StatutFacture.PARTIELLEMENT_PAYEE]: 'Partiellement payée',
  [StatutFacture.PAYEE]: 'Payée',
  [StatutFacture.EN_RETARD]: 'En retard',
  [StatutFacture.ANNULEE]: 'Annulée'
};

export const StatutFactureColor: { [key in StatutFacture]: string } = {
  [StatutFacture.BROUILLON]: 'secondary',
  [StatutFacture.NON_PAYEE]: 'warning',
  [StatutFacture.PARTIELLEMENT_PAYEE]: 'info',
  [StatutFacture.PAYEE]: 'success',
  [StatutFacture.EN_RETARD]: 'danger',
  [StatutFacture.ANNULEE]: 'dark'
};
