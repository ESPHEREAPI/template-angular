export interface Verrouillage {
  id?: number;
  datedebut?: string;
  dateFin?: string;
  montant?: number;
  taux?: number;
  typeVerrou?: string;
  verrouAuto?: boolean;
  verrouManuel?: boolean;
}
