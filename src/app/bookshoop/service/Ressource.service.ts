import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ressource, RessourceCreateRequest, TypeResource } from '../model/ressource';

@Injectable({
  providedIn: 'root'
})
export class RessourceService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/ressources`;
  private typesUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/types-resource`;

  constructor(private http: HttpClient) {}

  getTypes(): Observable<TypeResource[]> {
    return this.http.get<TypeResource[]>(this.typesUrl);
  }

  createType(type: TypeResource): Observable<TypeResource> {
    return this.http.post<TypeResource>(this.typesUrl, type);
  }

  deleteType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.typesUrl}/${id}`);
  }

  getByBoutiqueAndPeriode(boutiqueid: number, debut: string, fin: string): Observable<Ressource[]> {
    const params = new HttpParams().set('boutiqueid', boutiqueid.toString()).set('debut', debut).set('fin', fin);
    return this.http.get<Ressource[]>(this.apiUrl, { params });
  }

  create(request: RessourceCreateRequest): Observable<Ressource> {
    return this.http.post<Ressource>(this.apiUrl, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
