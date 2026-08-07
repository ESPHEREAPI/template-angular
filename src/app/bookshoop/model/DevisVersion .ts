import { EtatDevis } from "../bookshoop/enums/EtatDevis";

export interface DevisVersion {
  id: number;
  devisId: number;
  numero: number;
  dateCreation: Date;
  statut: EtatDevis;
  montantTTC: number;
}
