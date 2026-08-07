import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CompagnieOverview } from '../model/compagnie-overview';
import { VenteParCompagnie } from '../model/vente-par-compagnie';

@Injectable({
  providedIn: 'root'
})
export class PlatformDashboardService {

  private readonly ADMIN_URL = `${environment.apiUrl}/gateway-proxy/api/admin/dashboard`;
  private readonly PRODUITS_URL = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/admin/dashboard`;

  constructor(private http: HttpClient) { }

  getCompagniesOverview(): Observable<CompagnieOverview[]> {
    return this.http.get<CompagnieOverview[]>(`${this.ADMIN_URL}/compagnies-overview`);
  }

  getVentesParCompagnie(debut?: string, fin?: string): Observable<VenteParCompagnie[]> {
    let url = `${this.PRODUITS_URL}/ventes-par-compagnie`;
    const params: string[] = [];
    if (debut) params.push(`debut=${debut}`);
    if (fin) params.push(`fin=${fin}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<VenteParCompagnie[]>(url);
  }
}
