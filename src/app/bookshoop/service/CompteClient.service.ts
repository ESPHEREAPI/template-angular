import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/versement`;

  constructor(private http: HttpClient) {}

  getVersementsClient(clientId: number): Observable<VersementResponse[]> {
    return this.http.get<VersementResponse[]>(`${this.apiUrl}/client/${clientId}`);
  }
}
