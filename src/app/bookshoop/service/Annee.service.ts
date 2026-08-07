import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Annee } from '../model/annee';

@Injectable({
  providedIn: 'root'
})
export class AnneeService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/annees`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Annee[]> {
    return this.http.get<Annee[]>(this.apiUrl);
  }

  getById(id: number): Observable<Annee> {
    return this.http.get<Annee>(`${this.apiUrl}/${id}`);
  }

  create(annee: Partial<Annee>): Observable<Annee> {
    return this.http.post<Annee>(this.apiUrl, annee);
  }

  update(id: number, annee: Partial<Annee>): Observable<Annee> {
    return this.http.put<Annee>(`${this.apiUrl}/${id}`, annee);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
