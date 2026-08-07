import { Licence } from './licence';

export interface LicenceMine {
  active: Licence | null;
  pending: Licence | null;
  essaiDisponible: boolean;
}
