import { EvolutionMensuelle } from "./EvolutionMensuelle";

export interface FactureStatistiques {
  totalFactures: number;
  totalTtc: number;
  totalHt:number;
  montantPaye: number;
  montantImpaye:number;
  montantTotalRestant: number;
  nombreFacturesEnRetard: number;
  montantEnRetard: number;
  tauxRecouvrement: number;
  montantMoyenFacture: number;
  facturesParStatut: { [key: string]: number };
  evolutionMensuelle?: EvolutionMensuelle[];
  brouillon:number;
  nonPayees:number;
  partielles:number;
  payees:number;
  enRetard:number;
  annulees:number;
  moyenneJours:number;
}
