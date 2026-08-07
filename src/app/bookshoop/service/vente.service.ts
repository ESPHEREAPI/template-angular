import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../model/api-response';
import { Ticket } from '../model/ticket';
import { Vente } from '../model/vente';

@Injectable({
  providedIn: 'root'
})
export class VenteService {
private apiUrl = '/api/ventes';

  constructor(private http: HttpClient) {}

  creerVente(vente: Vente): Observable<ApiResponse<Vente>> {
    return this.http.post<ApiResponse<Vente>>(this.apiUrl, vente);
  }

  getProchainNumeroTicket(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/prochain-numero`);
  }

  imprimerTicket(venteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${venteId}/imprimer`, { responseType: 'blob' });
  }

  telechargerTicket(venteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${venteId}/telecharger`, { responseType: 'blob' });
  }
}
