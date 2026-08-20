// Correspond a EcomCheckoutController (backend).

export interface ItemCommande {
  produitId: number;
  quantite: number;
}

export interface CommandeRequest {
  items: ItemCommande[];
  guestNom?: string;
  guestEmail?: string;
  guestTelephone?: string;
  guestAdresse?: string;
}

export interface CommandeResponse {
  devisId: number;
  numeroDevis: string;
}

export interface CommandeResume {
  id: number;
  numeroDevis: string;
  statut: string;
  statutLibelle: string;
  dateDevis: string;
  total: number;
}
