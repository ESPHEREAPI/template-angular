import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MargeDetail } from '../model/marge-detail';

// Marge reelle (Ressources - Charges) d'une boutique sur une periode -
// distinct de MargeCible.service.ts (config de taux cible par categorie).
@Injectable({
  providedIn: 'root'
})
export class MargeReelleService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/marge-reelle`;

  constructor(private http: HttpClient) {}

  getDetail(boutiqueid: number, debut: string, fin: string): Observable<MargeDetail> {
    const params = new HttpParams().set('boutiqueid', boutiqueid.toString()).set('debut', debut).set('fin', fin);
    return this.http.get<MargeDetail>(this.apiUrl, { params });
  }
}
