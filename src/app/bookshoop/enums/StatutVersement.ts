export enum StatutVersement {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  ANNULE = 'ANNULE',
  REJETE = 'REJETE'
}

export const StatutVersementLibelle: { [key in StatutVersement]: string } = {
  [StatutVersement.EN_ATTENTE]: 'En attente',
  [StatutVersement.VALIDE]: 'Validé',
  [StatutVersement.ANNULE]: 'Annulé',
  [StatutVersement.REJETE]: 'Rejeté'
};

export const StatutVersementColor: { [key in StatutVersement]: string } = {
  [StatutVersement.EN_ATTENTE]: 'warning',
  [StatutVersement.VALIDE]: 'success',
  [StatutVersement.ANNULE]: 'danger',
  [StatutVersement.REJETE]: 'dark'
};