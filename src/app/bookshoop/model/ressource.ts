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
