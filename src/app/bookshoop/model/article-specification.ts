import { Produit } from "./produit";
import { Specification } from "./specification";

export interface ArticleSpecification {
    id?: number;
  specifique: Specification;
  libelle: string;
  prodduit?: Produit;
}
