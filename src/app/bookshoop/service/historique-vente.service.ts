import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Annee } from '../model/annee';
import { Vente } from '../model/vente';

// Historique vente (Comptabilite) : vue consolidee une/plusieurs/toutes
// les boutiques de la compagnie courante - distinct de HistoriqueCaisseService
// (Vente), reste mono-boutique/caissier et ne doit pas etre touche.
@Injectable({
  providedIn: 'root'
})
export class HistoriqueVenteService {

  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) {}

  // boutiqueIds vide/absent = toute la compagnie courante
  private appendBoutiqueIds(params: HttpParams, boutiqueIds: number[]): HttpParams {
    for (const id of boutiqueIds) {
      params = params.append('boutiqueIds', id.toString());
    }
    return params;
  }

  getAnnees(boutiqueIds: number[] = []): Observable<Annee[]> {
    let params = new HttpParams();
    params = this.appendBoutiqueIds(params, boutiqueIds);
    return this.http.get<Annee[]>(`${this.apiUrl}/historique-vente/annees`, { params });
  }

  getDatesByAnnee(anneeId: number, boutiqueIds: number[] = []): Observable<Date[]> {
    let params = new HttpParams().set('anneeId', anneeId.toString());
    params = this.appendBoutiqueIds(params, boutiqueIds);
    return this.http.get<Date[]>(`${this.apiUrl}/marge-dates`, { params });
  }

  getHistoriqueVenteByDate(anneeId: number, datevente: Date, boutiqueIds: number[] = []): Observable<Vente[]> {
    let params = new HttpParams().set('anneeId', anneeId.toString());
    params = this.appendBoutiqueIds(params, boutiqueIds);

    // Formatage explicite en yyyy-MM-dd, comme HistoriqueCaisseService.
    const d = new Date(datevente);
    const anneeStr = d.getFullYear();
    const moisStr = String(d.getMonth() + 1).padStart(2, '0');
    const jourStr = String(d.getDate()).padStart(2, '0');
    params = params.set('datevente', `${anneeStr}-${moisStr}-${jourStr}`);

    return this.http.get<Vente[]>(`${this.apiUrl}/historique-vente`, { params });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}
