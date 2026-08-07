import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Licence } from '../model/licence';
import { CreateLicenceRequest } from '../model/create-licence-request';
import { LicenceMine } from '../model/licence-mine';
import { LicenceSettings } from '../model/licence-settings';

@Injectable({
  providedIn: 'root'
})
export class LicenceService {

  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api/licences`;

  constructor(private http: HttpClient) { }

  generer(request: CreateLicenceRequest): Observable<Licence> {
    return this.http.post<Licence>(this.API_URL, request);
  }

  getByCompagnie(compagnieId: number): Observable<Licence> {
    return this.http.get<Licence>(`${this.API_URL}/compagnie/${compagnieId}`);
  }

  getModulesDisponibles(compagnieId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/compagnie/${compagnieId}/modules-disponibles`);
  }

  getModulesCatalogue(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/modules-catalogue`);
  }

  getMesModulesActifs(): Observable<string[] | null> {
    return this.http.get<string[] | null>(`${this.API_URL}/mes-modules-actifs`);
  }

  revoquer(compagnieId: number): Observable<Licence> {
    return this.http.post<Licence>(`${this.API_URL}/compagnie/${compagnieId}/revoquer`, {});
  }

  suspendre(compagnieId: number): Observable<Licence> {
    return this.http.post<Licence>(`${this.API_URL}/compagnie/${compagnieId}/suspendre`, {});
  }

  reactiver(compagnieId: number): Observable<Licence> {
    return this.http.post<Licence>(`${this.API_URL}/compagnie/${compagnieId}/reactiver`, {});
  }

  // ===================== Self-service COMPANY_ADMIN =====================

  getMine(): Observable<LicenceMine> {
    return this.http.get<LicenceMine>(`${this.API_URL}/me`);
  }

  getHistorique(): Observable<Licence[]> {
    return this.http.get<Licence[]>(`${this.API_URL}/me/historique`);
  }

  activerParCle(cle: string): Observable<Licence> {
    return this.http.post<Licence>(`${this.API_URL}/me/activer`, { cle });
  }

  demarrerEssai(): Observable<Licence> {
    return this.http.post<Licence>(`${this.API_URL}/me/essai`, {});
  }

  // ===================== Parametres essai (SUPER_ADMIN) =====================

  getParametres(): Observable<LicenceSettings> {
    return this.http.get<LicenceSettings>(`${this.API_URL}/parametres`);
  }

  updateParametres(settings: Partial<LicenceSettings>): Observable<LicenceSettings> {
    return this.http.put<LicenceSettings>(`${this.API_URL}/parametres`, settings);
  }
}
