import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TypeClientResponse } from '../model/TypeClientResponse';
import { TypeClient } from '../model/typeclient';

@Injectable({
  providedIn: 'root'
})
export class TypeClientService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/types-client`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10, search?: string): Observable<TypeClientResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<TypeClientResponse>(this.apiUrl, { params });
  }

  getAllSimple(): Observable<TypeClient[]> {
    return this.http.get<TypeClient[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<TypeClient> {
    return this.http.get<TypeClient>(`${this.apiUrl}/${id}`);
  }

  create(typeClient: TypeClient): Observable<TypeClient> {
    return this.http.post<TypeClient>(this.apiUrl, typeClient);
  }

  update(id: number, typeClient: TypeClient): Observable<TypeClient> {
    return this.http.put<TypeClient>(`${this.apiUrl}/${id}`, typeClient);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
