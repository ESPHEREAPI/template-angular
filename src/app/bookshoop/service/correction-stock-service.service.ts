import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Boutique } from '../model/boutique';
import { ApiResponse } from '../model/api-response';
import { Observable } from 'rxjs';
import { Categorie } from '../model/categorie';
import { PointVente } from '../model/point-vente';
import { Depot } from '../model/depot';

@Injectable({
  providedIn: 'root'
})
export class CorrectionStockServiceService {
  private readonly baseUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) {}

  // Récupérer toutes les boutiques
  getBoutiques(): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.baseUrl}/depots-boutique`);
  }

  // Récupérer toutes les catégories
  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.baseUrl}/categories`);
  }

  // Récupérer les points de vente par boutique et catégorie
  getPointsVente(boutiqueid?: number, categorieid?: number): Observable<PointVente[]> {
   /**  let params = new HttpParams();
    if (boutiqueId) {
      params = params.set('boutiqueId', boutiqueId.toString());
    }
    if (categorieId) {
      params = params.set('categorieId', categorieId.toString());
    }**/
     
    return this.http.get<PointVente[]>(`${this.baseUrl}/points-vente/${boutiqueid}/${categorieid}`);
  }


  // Sauvegarder les corrections de stock - le motif est obligatoire cote
  // backend (voir InventairesService.saveStockInventaire), pour pouvoir
  // tracer pourquoi une quantite a ete corrigee manuellement.
  saveCorrections(pointsVente: PointVente[], motif: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/corrections-stock`, { motif, lignes: pointsVente });
  }

  // Imprimer le rapport
  printReport(boutiqueId?: number, categorieId?: number): Observable<Blob> {
    let params = new HttpParams();
    if (boutiqueId) {
      params = params.set('boutiqueId', boutiqueId.toString());
    }
    if (categorieId) {
      params = params.set('categorieId', categorieId.toString());
    }
    
    return this.http.get(`${this.baseUrl}/corrections-stock/print`, { 
      params, 
      responseType: 'blob' 
    });
  }

 
}
