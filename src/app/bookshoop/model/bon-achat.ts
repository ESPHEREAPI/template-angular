export interface ClientBonAchat {
  id?: number;
  nom: string;
  telephone?: string;
  email?: string;
  fidelite?: boolean;
}

export interface BonAchat {
  id?: number;
  codeBon: string;
  montantTotal: number;
  montantUtilise?: number;
  dateExpiration?: string;
  actif: boolean;
  clientBonAchat: ClientBonAchat;
}
