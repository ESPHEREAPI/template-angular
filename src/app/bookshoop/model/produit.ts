import { ArticleSpecification } from "./article-specification";
import { Categorie } from "./categorie";

export interface Produit {
    id?: number;
  reference: string;
  libelle: string;
  categoriesid?: number;
  categories?: Categorie;
  prixVenteModifiable: boolean;
  pacquets: boolean;
  quantiteByPacquet: number;
  actif?: boolean;
  description?:string;
  deletes: boolean;
  specifications?: ArticleSpecification[];
  prixVenteModifiableAccepter?:number;
  username?:string;
   prixVenteNet: number;
  prixVenteTTC: number;
  stockFinal: number;
  quantitePrete: number;
  quantiteLivree: number;
  remise: number;
  tva: number;
  barcode?: string;
  stock?:number;
  prixVente?:number;


}
