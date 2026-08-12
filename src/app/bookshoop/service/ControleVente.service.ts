import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ControleVenteDTO, ControleVenteSummaryDTO } from '../model/controle-vente';

@Injectable({
  providedIn: 'root'
})
export class ControleVenteService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/controle-vente`;

  constructor(private http: HttpClient) {}

  // boutiqueIds vide/absent = toute la compagnie courante
  private buildParams(moisId: number, anneeid: number, boutiqueIds: number[]): HttpParams {
    let params = new HttpParams()
      .set('moisId', moisId.toString())
      .set('anneeid', anneeid.toString());
    for (const id of boutiqueIds) {
      params = params.append('boutiqueIds', id.toString());
    }
    return params;
  }

  generer(moisId: number, anneeid: number, boutiqueIds: number[]): Observable<ControleVenteDTO[]> {
    return this.http.get<ControleVenteDTO[]>(this.apiUrl, { params: this.buildParams(moisId, anneeid, boutiqueIds) });
  }

  getSummary(moisId: number, anneeid: number, boutiqueIds: number[]): Observable<ControleVenteSummaryDTO> {
    return this.http.get<ControleVenteSummaryDTO>(`${this.apiUrl}/summary`, { params: this.buildParams(moisId, anneeid, boutiqueIds) });
  }
}
