import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommandeRequest, CommandeResponse, CommandeResume } from '../model/storefront-order';

@Injectable({ providedIn: 'root' })
export class StorefrontCheckoutService {
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com/compagnie`;

  constructor(private http: HttpClient) {}

  passerCommande(code: string, boutiqueId: number, request: CommandeRequest): Observable<CommandeResponse> {
    return this.http.post<CommandeResponse>(`${this.apiUrl}/${code}/boutiques/${boutiqueId}/commandes`, request);
  }

  mesCommandes(code: string): Observable<CommandeResume[]> {
    return this.http.get<CommandeResume[]>(`${this.apiUrl}/${code}/mes-commandes`);
  }
}
