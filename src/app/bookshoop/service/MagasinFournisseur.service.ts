import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MagasinFournisseur, MagasinFournisseurRequest } from '../model/magasin-fournisseur';
import { Fournisseur } from '../model/fournisseur';

@Injectable({
  providedIn: 'root'
})
export class MagasinFournisseurService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/magasin-fournisseur`;

  constructor(private http: HttpClient) {}

  getByFournisseur(fournisseurId: number): Observable<MagasinFournisseur[]> {
    return this.http.get<MagasinFournisseur[]>(`${this.apiUrl}/fournisseur/${fournisseurId}`);
  }

  /** Fournisseurs disponibles pour approvisionner ce magasin : associations dediees + "disponible partout". */
  getDisponiblesPourMagasin(depotId: number): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(`${this.apiUrl}/disponibles/${depotId}`);
  }

  create(request: MagasinFournisseurRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  delete(depotId: number, fournisseurId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${depotId}/${fournisseurId}`);
  }
}
