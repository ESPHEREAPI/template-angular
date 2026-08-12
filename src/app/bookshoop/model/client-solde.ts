// Solde consolide d'un client (recouvrement) : total facture, total paye,
// reste a payer, toutes factures confondues.
export interface ClientSolde {
  clientId: number;
  nom: string;
  code: string;
  telephone: string;
  totalFacture: number;
  totalPaye: number;
  soldeRestant: number;
  nombreFactures: number;
}
