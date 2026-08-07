import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MargeCible, MargeCibleRequest } from '../model/marge-cible';

@Injectable({
  providedIn: 'root'
})
export class MargeCibleService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/marges-cibles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MargeCible[]> {
    return this.http.get<MargeCible[]>(this.apiUrl);
  }

  create(request: MargeCibleRequest): Observable<MargeCible> {
    return this.http.post<MargeCible>(this.apiUrl, request);
  }

  update(id: number, request: MargeCibleRequest): Observable<MargeCible> {
    return this.http.put<MargeCible>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
