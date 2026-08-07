import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { StockUpdateRequest } from '../model/stock-update-request';
import { StockUpdateResponse } from '../model/stock-update-reponse';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockServiceService {

  private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  constructor(private http: HttpClient) {}

  /**
   * Met à jour le stock après une vente
   */
  updateStockAfterSale(productId: number, quantitySold: number): Observable<StockUpdateResponse> {
    const request: StockUpdateRequest = {
      productId: productId,
      quantity: quantitySold,
      type: 'SALE',
      reason: 'Vente caisse'
    };

    return this.http.post<StockUpdateResponse>(`${this.apiUrl}/update-after-sale`, request)
      .pipe(
        tap((response:StockUpdateResponse) => {
          console.log(`Stock mis à jour pour le produit ${productId}: nouveau stock = ${response.newStock}`);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Vérifie la disponibilité du stock pour un produit
   */
  checkStockAvailability(productId: number, requestedQuantity: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-availability/${productId}/${requestedQuantity}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtient le stock actuel d'un produit
   */
  getCurrentStock(productId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/current/${productId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour le stock manuellement (ajustement)
   */
  adjustStock(productId: number, newQuantity: number, reason: string): Observable<StockUpdateResponse> {
    const request: StockUpdateRequest = {
      productId: productId,
      quantity: newQuantity,
      type: 'ADJUSTMENT',
      reason: reason
    };

    return this.http.post<StockUpdateResponse>(`${this.apiUrl}/adjust`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Annule une mise à jour de stock (en cas d'annulation de vente)
   */
  revertStockUpdate(productId: number, quantity: number): Observable<StockUpdateResponse> {
    const request: StockUpdateRequest = {
      productId: productId,
      quantity: quantity,
      type: 'ADJUSTMENT',
      reason: 'Annulation vente'
    };

    return this.http.post<StockUpdateResponse>(`${this.apiUrl}/revert`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la mise à jour du stock';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Erreur StockService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
