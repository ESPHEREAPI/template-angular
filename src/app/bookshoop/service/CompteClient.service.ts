import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClientSolde } from '../model/client-solde';

export interface VersementResponse {
  id: number;
  numeroVersement: string;
  dateVersement: string;
  montant: number;
  modePaiement: string;
  statut: string;
  factureId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompteClientService {
  private versementUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/versement`;
  private soldeUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/compte-client`;

  constructor(private http: HttpClient) {}

  getVersementsClient(clientId: number): Observable<VersementResponse[]> {
    return this.http.get<VersementResponse[]>(`${this.versementUrl}/client/${clientId}`);
  }

  // Classement "clients a haute redevance" (plus gros reste-a-payer en tete).
  getSoldesClients(): Observable<ClientSolde[]> {
    return this.http.get<ClientSolde[]>(`${this.soldeUrl}/soldes`);
  }

  getSoldeClient(clientId: number): Observable<ClientSolde> {
    return this.http.get<ClientSolde>(`${this.soldeUrl}/${clientId}/solde`);
  }

  getTotalAttendu(): Observable<number> {
    return this.http.get<number>(`${this.soldeUrl}/total-attendu`);
  }
}
