import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpecifiqueResponse } from '../model/SpecifiqueResponse';
import { Specifique } from '../model/specifique';

@Injectable({
  providedIn: 'root'
})
export class SpecifiqueService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/specifiques`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10, search?: string): Observable<SpecifiqueResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<SpecifiqueResponse>(this.apiUrl, { params });
  }

  getAllSimple(): Observable<Specifique[]> {
    return this.http.get<Specifique[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Specifique> {
    return this.http.get<Specifique>(`${this.apiUrl}/${id}`);
  }

  create(specifique: Specifique): Observable<Specifique> {
    return this.http.post<Specifique>(this.apiUrl, specifique);
  }

  update(id: number, specifique: Specifique): Observable<Specifique> {
    return this.http.put<Specifique>(`${this.apiUrl}/${id}`, specifique);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
