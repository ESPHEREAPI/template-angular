import { Vente } from "./vente";

export interface HistoriqueCaisse {
    totalCaisse: number;
    remiseTicket: number;
    totalTicketNonEnregistreEnCaisse: number;
    montantBonAchatSortieByCaisse: number;
    montantBonAchatEncaisserByCaisse: number;
    montantCodeMarchantMtn: number;
    montantCodeMarchantOrange: number;
    totalTicketEnregistreEnCaisse: number;
    ventes: Vente[];
}
