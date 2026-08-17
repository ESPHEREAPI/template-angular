import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApercuImportStock, ModeRestauration, StockImportFormat } from '../model/stock-import-format';

/**
 * Format de restauration de stock (personnalisation, cote microservice-
 * administration) + generation du modele / previsualisation / application
 * de la restauration (cote microservice-produits, seul detenteur du stock -
 * voir StockRestaurationController).
 */
@Injectable({
  providedIn: 'root'
})
export class StockImportService {

  private readonly FORMAT_URL = `${environment.apiUrl}/gateway-proxy/api/compagnies/me/stock-import-format`;
  private readonly RESTAURATION_URL = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/stock-restauration`;

  constructor(private http: HttpClient) { }

  getFormat(): Observable<StockImportFormat> {
    return this.http.get<StockImportFormat>(this.FORMAT_URL);
  }

  updateFormat(format: StockImportFormat): Observable<StockImportFormat> {
    return this.http.put<StockImportFormat>(this.FORMAT_URL, format);
  }

  telechargerModele(boutiqueId: number | null): Observable<Blob> {
    const params = boutiqueId ? `?boutiqueId=${boutiqueId}` : '';
    return this.http.get(`${this.RESTAURATION_URL}/modele${params}`, { responseType: 'blob' });
  }

  previsualiser(fichier: File, boutiqueId: number | null, mode: ModeRestauration): Observable<ApercuImportStock> {
    const formData = new FormData();
    formData.append('fichier', fichier);
    const params = new URLSearchParams({ mode });
    if (boutiqueId) { params.set('boutiqueId', String(boutiqueId)); }
    return this.http.post<ApercuImportStock>(`${this.RESTAURATION_URL}/previsualiser?${params.toString()}`, formData);
  }

  appliquer(fichier: File, boutiqueId: number | null, mode: ModeRestauration): Observable<{ batchId: string }> {
    const formData = new FormData();
    formData.append('fichier', fichier);
    const params = new URLSearchParams({ mode });
    if (boutiqueId) { params.set('boutiqueId', String(boutiqueId)); }
    return this.http.post<{ batchId: string }>(`${this.RESTAURATION_URL}/appliquer?${params.toString()}`, formData);
  }
}
