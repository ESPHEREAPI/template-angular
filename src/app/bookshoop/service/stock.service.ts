import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StockMovement } from '../../model/stock-movement';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits/stock-movement`;
  
  constructor(private http: HttpClient) { }
  
  /**
   * Récupère le stock d'un produit
   */
  getStockTotal(produitId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/produit/${produitId}`);
  }
  
  /**
   * Récupère l'historique des mouvements
   */
  getMouvements(
    produitId?: number,
    pointVenteId?: number
  ): Observable<StockMovement[]> {
    let params = new HttpParams();
    
    if (produitId) {
      params = params.set('produitId', produitId.toString());
    }
    if (pointVenteId) {
      params = params.set('pointVenteId', pointVenteId.toString());
    }
    
    return this.http.get<StockMovement[]>(
      `${this.apiUrl}/mouvements`,
      { params }
    );
  }
}
