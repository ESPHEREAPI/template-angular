export interface TransfertRequest {
  produitId: number;
  magasinSourceId: number;
  magasinDestinationId: number;
  quantite: number;
  notes?: string;
  username:string;
}