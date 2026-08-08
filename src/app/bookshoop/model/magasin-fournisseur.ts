export interface MagasinFournisseur {
  depotId: number;
  fournisseurId: number;
  magasinCode?: string;
  magasinLibelle?: string;
  boutiqueNom?: string;
  fournisseurCode?: string;
  fournisseurNom?: string;
  fournisseurEmail?: string;
  fournisseurTel?: string;
  fournisseurVille?: string;
}

export interface MagasinFournisseurRequest {
  depotId: number;
  fournisseurId: number;
}
