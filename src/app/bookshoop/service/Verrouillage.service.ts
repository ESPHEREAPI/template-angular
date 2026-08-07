import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VerrouillageResponse } from '../model/VerrouillageResponse';
import { Verrouillage } from '../model/verrouillage';

@Injectable({
  providedIn: 'root'
})
export class VerrouillageService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/verrouillages`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10): Observable<VerrouillageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<VerrouillageResponse>(`${this.apiUrl}/page`, { params });
  }

  getById(id: number): Observable<Verrouillage> {
    return this.http.get<Verrouillage>(`${this.apiUrl}/${id}`);
  }

  create(verrouillage: Verrouillage): Observable<Verrouillage> {
    return this.http.post<Verrouillage>(this.apiUrl, verrouillage);
  }

  update(id: number, verrouillage: Verrouillage): Observable<Verrouillage> {
    return this.http.put<Verrouillage>(`${this.apiUrl}/${id}`, verrouillage);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
