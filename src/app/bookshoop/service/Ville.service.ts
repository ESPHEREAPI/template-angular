// src/app/services/ville.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VilleResponse } from '../model/VilleResponse';
import { Ville } from '../model/ville';


@Injectable({
  providedIn: 'root'
})
export class VilleService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/villes`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10, search?: string): Observable<VilleResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<VilleResponse>(this.apiUrl, { params });
  }

  getAllSimple(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Ville> {
    return this.http.get<Ville>(`${this.apiUrl}/${id}`);
  }

  create(ville: Ville): Observable<Ville> {
    return this.http.post<Ville>(this.apiUrl, ville);
  }

  update(id: number, ville: Ville): Observable<Ville> {
    return this.http.put<Ville>(`${this.apiUrl}/${id}`, ville);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}