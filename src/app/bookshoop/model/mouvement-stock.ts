import { TypeMouvement } from "../enums/TypeMouvement ";

export interface MouvementStock {
    id: number;
  pointVenteId: number;
  produitId: number;
  type: TypeMouvement;
  quantite: number;
  prixUnitaire?: number;
  motif?: string;
  reference?: string;
  utilisateurId: number;
  dateCreation: Date;
}
