import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ArticlePublic, ArticlesPage, CategoriePublique, CompagniePublique } from '../model/storefront-catalog';

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

  getProduits(
    code: string,
    boutiqueId: number,
    page = 0,
    size = 20,
    categorieId?: number | null,
    search?: string | null
  ): Observable<ArticlesPage> {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (categorieId != null) {
      params['categorieId'] = String(categorieId);
    }
    if (search) {
      params['search'] = search;
    }
    return this.http.get<ArticlesPage>(`${this.apiUrl}/${code}/boutiques/${boutiqueId}/produits`, { params });
  }

  getCategories(code: string, boutiqueId: number): Observable<CategoriePublique[]> {
    return this.http.get<CategoriePublique[]>(`${this.apiUrl}/${code}/boutiques/${boutiqueId}/categories`);
  }

  getProduitDetail(code: string, boutiqueId: number, produitId: number): Observable<ArticlePublic> {
    return this.http.get<ArticlePublic>(`${this.apiUrl}/${code}/boutiques/${boutiqueId}/produits/${produitId}`);
  }

  photoUrl(code: string, produitId: number): string {
    return `${this.apiUrl}/${code}/produits/${produitId}/photo`;
  }
}
