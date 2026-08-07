import { EvolutionMensuelleVersement } from "./EvolutionMensuelleVersement";
import { VersementStatParMode } from "./VersementStatParMode";

export interface VersementStatistiques {
  totalVersements: number;
  montantTotal: number;
  montantMoyenVersement: number;
  nombreVersementsValides: number;
  montantVersementsValides: number;
  versementsParMode: { [key: string]: VersementStatParMode };
  evolutionMensuelle?: EvolutionMensuelleVersement[];
}