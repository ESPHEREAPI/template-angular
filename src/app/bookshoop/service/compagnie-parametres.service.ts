import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CompagnieParametres } from '../model/compagnie-parametres';

@Injectable({
  providedIn: 'root'
})
export class CompagnieParametresService {

  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api/compagnies/me/parametres`;

  constructor(private http: HttpClient) { }

  getOwn(): Observable<CompagnieParametres> {
    return this.http.get<CompagnieParametres>(this.API_URL);
  }

  updateOwn(parametres: CompagnieParametres): Observable<CompagnieParametres> {
    return this.http.put<CompagnieParametres>(this.API_URL, parametres);
  }
}
