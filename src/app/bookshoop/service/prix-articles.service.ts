import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PaginationResponse } from '../model/pagination-response';
import { PrixArticles, PromotionUpdate } from '../model/prix-articles';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { Boutique } from '../model/boutique';

@Injectable({
  providedIn: 'root'
})
export class PrixArticlesService {
  private articleAjouteSubject = new Subject<void>();
  articleAjoute$ = this.articleAjouteSubject.asObservable();

  // Méthode à appeler quand un article est ajouté
  notifierArticleAjoute() {
    this.articleAjouteSubject.next();
  }

  //private apiUrl = 'http://localhost:8080/api';
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient, private autheService: AuthService) { }


  private getBoutiqueUser(): number {
    const user = this.autheService.getUserFromStorage();
    let boutiqueid : number=0;
    if (user) {
      console.log("user pour Boutique",user);
      if(!user.usersDTO || !user.usersDTO.boutiqueid) return 0;

      return user.usersDTO.boutiqueid;
    

    }
    return 0;
  }
  getPrixArticles(page: number = 0, size: number = 10, search?: string): Observable<PaginationResponse<PrixArticles>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
  let boutiqueid =this.autheService.getBoutiqueByUserSession();
  console.log("boutique",boutiqueid);
    return this.http.get<PaginationResponse<PrixArticles>>(`${this.apiUrl}/prix-articles/${boutiqueid}`, { params });
  }

  getPrixArticlesByMagasin(magasinid: number, page: number = 0, size: number = 10, search?: string): Observable<PaginationResponse<PrixArticles>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginationResponse<PrixArticles>>(`${this.apiUrl}/prix-articles/magasin/${magasinid}`, { params });
  }

  getPrixArticlesByFilters(filters: any): Observable<PrixArticles[]> {
    let boutiqueid =this.getBoutiqueUser();
    return this.http.post<PrixArticles[]>(`${this.apiUrl}/prix-articles/filter/${boutiqueid}`, filters);
  }

  // Modifier le prix et/ou activer un solde/promo sur une ligne PrixArticles
  // (un produit dans une boutique) - voir CommandeController.definirPromotion.
  definirPromotion(id: number, payload: PromotionUpdate): Observable<PrixArticles> {
    return this.http.put<PrixArticles>(`${this.apiUrl}/prix-articles/${id}/promotion`, payload);
  }
}
