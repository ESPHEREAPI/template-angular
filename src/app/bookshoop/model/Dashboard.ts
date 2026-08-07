import { Evolution } from "./Evolution";
import { ProduitFaible } from "./ProduitFaible";
import { ValeurMagasin } from "./ValeurMagasin";
import { ValeurPointVente } from "./ValeurPointVente";

export interface Dashboard {
  totalValeurStock: number;
  totalValeurMagasins: number;
  totalValeurPointsVente: number;
  nombreProduitsFaibles: number;
  nombreMouvements: number;
  valeurMagasins: ValeurMagasin[];
  valeurPointsVente: ValeurPointVente[];
  produitsFaibleStock: ProduitFaible[];
  evolutionStock: Evolution[];
}