import { Ressource, RessourceConsolidee } from './ressource';
import { Charge } from './charge';

// Marge reelle d'une boutique sur une periode = Ressources - Charges, avec
// le detail complet. Distinct de MargeCible (config de taux cible par
// categorie) et de MargeVente (marge par article, ecran Marge Caisse).
export interface MargeDetail {
  ressources: RessourceConsolidee;
  charges: Charge[];
  totalCharges: number;
  marge: number;
}
