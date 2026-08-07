// boutique.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Boutique } from '../model/boutique';
import { BoutiqueResponse } from '../model/BoutiqueResponse';


@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de toutes les boutiques actives
   */
  getBoutiques(): Observable<Boutique[]> {
    return this.http.get<Boutique[]>(`${this.apiUrl}/all`);
  }

  /**
   * Récupère une boutique par son ID
   */
  getBoutiqueById(id: number): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/boutiques/${id}`);
  }
   getAll(page: number = 0, size: number = 10, search?: string): Observable<BoutiqueResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<BoutiqueResponse>(`${this.apiUrl}/all-boutique`, { params });
  }

 

  getById(id: number): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/${id}`);
  }

  create(boutique: Boutique): Observable<Boutique> {
    return this.http.post<Boutique>(this.apiUrl, boutique);
  }

  update(id: number, boutique: Boutique): Observable<Boutique> {
    return this.http.put<Boutique>(`${this.apiUrl}/${id}`, boutique);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}