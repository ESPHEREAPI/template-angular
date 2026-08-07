export type LoginFormat = 'INITIALE_NOM' | 'PRENOM_POINT_NOM' | 'NOM_INITIALE_PRENOM' | 'CODE_TYPE_SEQUENCE';

export interface CompagnieParametres {
  pwdLongueurMin: number;
  pwdMajusculeRequise: boolean;
  pwdChiffreRequis: boolean;
  pwdSpecialRequis: boolean;
  pwdExpirationJours: number;
  tentativesMaxAvantVerrouillage: number;
  dureeVerrouillageMinutes: number;
  dureeSessionMinutes: number;
  loginFormat: LoginFormat;

  regimeFiscal: string | null;
  tvaApplicable: boolean;
  tauxTvaDefaut: number | null;
  prixTTC: boolean;

  ticketLargeurMm: number;
  ticketAfficherLogo: boolean;
  ticketEnTete: string | null;
  ticketPiedDePage: string | null;
  ticketAfficherMentionsFiscales: boolean;

  factureDevise: string;
  factureAfficherLogo: boolean;
  factureMentionsLegales: string | null;
  facturePrefixeNumerotation: string | null;
  factureEcheanceJoursDefaut: number;
}
