export interface PointEvolution {
  mois: string;
  total: number;
  nombre: number;
}

export interface VenteParBoutique {
  boutiqueId: number;
  boutiqueNom: string;
  total: number;
}

export interface CompagnieDashboard {
  totalVentesJour: number;
  nombreVentesJour: number;
  totalVentesMois: number;
  nombreVentesMois: number;
  montantImpaye: number;
  nombreFacturesImpayees: number;
  nombreProduitsStockFaible: number;
  evolutionVentes: PointEvolution[];
  ventesParBoutique: VenteParBoutique[];
}
