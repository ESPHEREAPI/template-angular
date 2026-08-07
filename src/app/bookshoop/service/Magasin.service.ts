// src/app/services/magasin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MagasinResponse } from '../model/MagasinResponse';
import { Magasin } from '../model/Magasin';


@Injectable({
  providedIn: 'root'
})
export class MagasinService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/magasins`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10, search?: string): Observable<MagasinResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<MagasinResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Magasin> {
    return this.http.get<Magasin>(`${this.apiUrl}/${id}`);
  }

  create(magasin: Magasin): Observable<Magasin> {
    return this.http.post<Magasin>(this.apiUrl, magasin);
  }

  update(id: number, magasin: Magasin): Observable<Magasin> {
    return this.http.put<Magasin>(`${this.apiUrl}/${id}`, magasin);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}