import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ArticlesPage, CompagniePublique } from '../model/storefront-catalog';

/**
 * Catalogue public par compagnie - consomme EcomPublicController
 * (deja anonyme/permitAll cote backend), aucune authentification requise.
 */
@Injectable({ providedIn: 'root' })
export class StorefrontCatalogService {
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com/compagnie`;

  constructor(private http: HttpClient) {}

  getCompagnie(code: string): Observable<CompagniePublique> {
    return this.http.get<CompagniePublique>(`${this.apiUrl}/${code}`);
  }

  getProduits(code: string, boutiqueId: number, page = 0, size = 20): Observable<ArticlesPage> {
    return this.http.get<ArticlesPage>(`${this.apiUrl}/${code}/boutiques/${boutiqueId}/produits`, {
      params: { page: String(page), size: String(size) }
    });
  }
}
