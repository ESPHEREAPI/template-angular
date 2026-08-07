import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompagnieDashboard } from '../model/compagnie-dashboard';

@Injectable({
  providedIn: 'root'
})
export class CompagnieDashboardService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/dashboard-compagnie`;

  constructor(private http: HttpClient) {}

  obtenirDashboard(): Observable<CompagnieDashboard> {
    return this.http.get<CompagnieDashboard>(this.apiUrl);
  }
}
