export interface TypeResource {
  id?: number;
  code: string;
  libelle: string;
}

export interface Ressource {
  id?: number;
  montant: number;
  dateRessource: string;
  commentaire?: string;
  typeResource?: TypeResource;
}

export interface RessourceCreateRequest {
  boutiqueId: number;
  typeResourceId: number;
  montant: number;
  dateRessource: string;
  commentaire?: string;
}

// Ressources manuelles + caisse (ventes) + versements clients, consolidees
// a l'affichage - caisse et versement client sont des types de ressource
// "systeme" reflechis automatiquement, jamais ressaisis a la main.
export interface RessourceConsolidee {
  ressourcesManuelles: Ressource[];
  totalRessourcesManuelles: number;
  totalCaisse: number;
  totalVersementClient: number;
  total: number;
}
