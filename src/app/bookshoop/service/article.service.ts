import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Produit } from '../model/produit';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Categorie } from '../model/categorie';
import { Specification } from '../model/specification';
import { ArticleSpecification } from '../model/article-specification';
import { CommandeFournisseur } from '../model/commande-fournisseur';
import { environment } from '../../../environments/environment';
import { PaginationResponse } from '../model/pagination-response';
import { ApiResponse } from '../model/api-response';
import { PrixArticles } from '../model/prix-articles';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

 private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  private articlesSubject = new BehaviorSubject<Produit[]>([]);
  public articles$ = this.articlesSubject.asObservable();

  constructor(private http: HttpClient,private authService:AuthService) {}

   getAllArticleByPage(page: number = 0, size: number = 10, search?: string,boutiqueid =this.authService.getBoutiqueByUserSession() ): Observable<PaginationResponse<Produit>> {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString());
      
      if (search) {
        params = params.set('query', search);
        params = params.set('category', search);
      }
  
      return this.http.get<PaginationResponse<Produit>>(`${this.apiUrl}/articles/search/${boutiqueid}`, { params });
    }
  // Articles CRUD
  getArticles(): Observable<Produit[]> {
    
    return this.http.get<Produit[]>(`${this.apiUrl}/articles`);
  }
  getAlerteStock(): Observable<PrixArticles[]> {
    
    return this.http.get<PrixArticles[]>(`${this.apiUrl}/alert-stock`);
  }

  getArticleById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/articles/${id}`);
  }

  createArticle(article: Produit): Observable<Produit> {
    return this.http.post<Produit>(`${this.apiUrl}/articles`, article);
  }

  updateArticle(article: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/articles/${article.id}`, article);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/articles/${id}`);
  }

  // Categories
  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/categories`);
  }

  // Specifiques
  getSpecifiques(): Observable<Specification[]> {
    return this.http.get<Specification[]>(`${this.apiUrl}/specifiques`);
  }

  // Article Specifications
  getArticleSpecifications(articleId: number): Observable<ArticleSpecification[]> {
    return this.http.get<ArticleSpecification[]>(`${this.apiUrl}/articles/${articleId}/specifications`);
  }

  updateArticleSpecification(specification: ArticleSpecification): Observable<ArticleSpecification> {
    return this.http.put<ArticleSpecification>(`${this.apiUrl}/specifications/${specification.id}`, specification);
  }

  // Fournisseurs par article
  getFournisseursByArticle(articleId: number): Observable<CommandeFournisseur[]> {
    return this.http.get<CommandeFournisseur[]>(`${this.apiUrl}/articles/${articleId}/fournisseurs`);
  }

  // Refresh articles list
  refreshArticles(): void {
    this.getArticles().subscribe(articles => {
      this.articlesSubject.next(articles);
    });
  }





}
