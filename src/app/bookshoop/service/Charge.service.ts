import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Charge, ChargeCreateRequest, TypeDepense } from '../model/charge';

@Injectable({
  providedIn: 'root'
})
export class ChargeService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/charges`;
  private typesUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/types-depense`;

  constructor(private http: HttpClient) {}

  getTypes(): Observable<TypeDepense[]> {
    return this.http.get<TypeDepense[]>(this.typesUrl);
  }

  createType(type: TypeDepense): Observable<TypeDepense> {
    return this.http.post<TypeDepense>(this.typesUrl, type);
  }

  deleteType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.typesUrl}/${id}`);
  }

  getByBoutiqueAndPeriode(boutiqueid: number, debut: string, fin: string): Observable<Charge[]> {
    const params = new HttpParams().set('boutiqueid', boutiqueid.toString()).set('debut', debut).set('fin', fin);
    return this.http.get<Charge[]>(this.apiUrl, { params });
  }

  create(request: ChargeCreateRequest): Observable<Charge> {
    return this.http.post<Charge>(this.apiUrl, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
