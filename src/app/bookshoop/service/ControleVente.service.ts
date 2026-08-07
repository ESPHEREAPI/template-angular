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

  generer(moisId: number, anneeid: number, boutiqueid: number): Observable<ControleVenteDTO[]> {
    const params = new HttpParams()
      .set('moisId', moisId.toString())
      .set('anneeid', anneeid.toString())
      .set('boutiqueid', boutiqueid.toString());
    return this.http.get<ControleVenteDTO[]>(this.apiUrl, { params });
  }

  getSummary(moisId: number, anneeid: number, boutiqueid: number): Observable<ControleVenteSummaryDTO> {
    const params = new HttpParams()
      .set('moisId', moisId.toString())
      .set('anneeid', anneeid.toString())
      .set('boutiqueid', boutiqueid.toString());
    return this.http.get<ControleVenteSummaryDTO>(`${this.apiUrl}/summary`, { params });
  }
}
