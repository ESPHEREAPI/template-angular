// Correspond a SpecificationArticleDTO cote backend (projection, jamais
// l'entite Specificationarticles brute).
export interface ArticleSpecification {
  id: number;
  produitId: number;
  specifiqueId: number;
  specifiqueLibelle: string;
  valeur: string;
}
