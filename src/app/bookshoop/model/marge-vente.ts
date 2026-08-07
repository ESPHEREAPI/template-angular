import { ComponentSomething } from "./component-something";
import { Produit } from "./produit";

export interface MargeVente {
    id?: number;
  libelle: string;
  quantite: number;
  prixVente: number;
  montant: number;
  achat: number;
  montanAchat: number;
  marge: number;
  p?: Produit;
  cpns?: ComponentSomething;
  usercreat?:string;
  prixachatid?:number;
  datevente?:Date
}
