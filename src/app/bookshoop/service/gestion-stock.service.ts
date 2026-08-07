import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { StockItem } from '../model/stock-item';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PrixArticles } from '../model/prix-articles';
import { environment } from '../../../environments/environment';
import { StockResponse } from '../model/stock-response';
import { LibelleStock } from '../model/libelle-stock';
import { ApiResponse } from '../model/api-response';
import { StockFilter } from '../model/stock-filter';
import { PaginationConfig } from '../model/pagination-config';
import { PrixArticlesService } from './prix-articles.service';
//import { map } from 'jquery';
import * as $ from 'jquery';


@Injectable({
  providedIn: 'root'
})
export class GestionStockService {

private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  private stockDataSubject = new BehaviorSubject<PrixArticles[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public stockData$ = this.stockDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des libellés de stock
   */
  getLibelleStock(): Observable<LibelleStock[]> {
    return this.http.get<ApiResponse<LibelleStock[]>>(`${this.apiUrl}/libelles`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError<LibelleStock[]>('getLibelleStock', []))
      );
  }

  /**
   * Charge les données de stock par point de vente
   */
  loadStockByPointVente(
    libelleStockId: number,
    filter: StockFilter = {},
    pagination: PaginationConfig
  ): Observable<{ data: PrixArticles[], total: number }> {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('libelleStockId', libelleStockId.toString())
      .set('page', pagination.page.toString())
      .set('size', pagination.size.toString());

    // Ajout des filtres
    if (filter.reference) {
      params = params.set('reference', filter.reference);
    }
    if (filter.libelle) {
      params = params.set('libelle', filter.libelle);
    }
    if (filter.globalFilter) {
      params = params.set('globalFilter', filter.globalFilter);
    }

    return this.http.get<ApiResponse<{ data: PrixArticles[], total: number }>>(`${this.apiUrl}/by-point-vente`, { params })
      .pipe(
        map(response => {
          this.stockDataSubject.next(response.data.data);
          this.loadingSubject.next(false);
          return response.data;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError<{ data: PrixArticles[], total: number }>('loadStockByPointVente', { data: [], total: 0 })(error);
        })
      );
  }

  /**
   * Exporte les données de stock en PDF
   */
  exportStockToPdf(libelleStockId: number): Observable<Blob> {
    const params = new HttpParams().set('libelleStockId', libelleStockId.toString());
    
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('exportStockToPdf'))
    );
  }

  /**
   * Calcule la quantité totale (stock initial + entrée)
   */
  calculateTotalQuantity(item: PrixArticles): number {
    return item.pointVente.stockInitial + item.pointVente.entreeProduit;
  }

  /**
   * Calcule l'estimation du stock
   */
  calculateStockEstimation(item: PrixArticles): number {
    return item.pointVente.stockFinalTheorie * item.prixVenteNet;
  }

  /**
   * Formate un nombre avec séparateurs de milliers
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  /**
   * Détermine la classe CSS pour le style de ligne selon le stock
   */
  getRowStyleClass(stockFinal: number): string {
    return stockFinal === 0 ? 'table-danger' : '';
  }

  /**
   * Gestion d'erreur générique
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return new Observable(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }
} */
private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed: ${error.message}`);
    return of(result as T);
  };
}

}
