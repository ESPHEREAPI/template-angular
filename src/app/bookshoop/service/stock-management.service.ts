// src/app/service/stock-management.service.ts - VERSION CORRIGÉE

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Produit } from '../model/produit';
import { BehaviorSubject, interval, map, Observable, Subject, takeUntil, tap, catchError, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

export interface StockAlert {
  articleId: number;
  libelle: string;
  stockActuel: number;
  seuilAlerte: number;
  type: 'RUPTURE' | 'ALERTE' | 'NORMAL';
}

@Injectable({
  providedIn: 'root'
})
export class StockManagementService {

  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  private readonly SEUIL_ALERTE = 5;
  private readonly POLL_INTERVAL = 30000;

  // ✅ AJOUT: Headers HTTP par défaut
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  private stockUpdatedSubject = new Subject<Produit>();
  public stockUpdated$ = this.stockUpdatedSubject.asObservable();

  private stockAlertSubject = new BehaviorSubject<StockAlert[]>([]);
  public stockAlert$ = this.stockAlertSubject.asObservable();

  private articlesStockSubject = new BehaviorSubject<Map<number, number>>(new Map());
  public articlesStock$ = this.articlesStockSubject.asObservable();

  private destroy$ = new Subject<void>();
  private stockCache = new Map<number, { stock: number; timestamp: number }>();
  private CACHE_DURATION = 10000;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.initializeStockPolling();
  }

  private initializeStockPolling(): void {
    interval(this.POLL_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshAllStocks();
      });
  }

  /**
   * ✅ VERSION CORRIGÉE: Utilise l'endpoint batch avec quantite=0
   */
  getStockProduit(productId: number, forceRefresh = false): Observable<number> {
    if (!forceRefresh && this.stockCache.has(productId)) {
      const cached = this.stockCache.get(productId)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return of(cached.stock);
      }
    }

    const boutiqueid = this.authService.getBoutiqueByUserSession();
    
    // ✅ Utiliser l'endpoint batch existant avec quantite=0
    const body = [{
      articleId: productId,
      quantite: 0  // 0 = juste lire, pas décrémenter
    }];
    
    return this.http.post<{[key: string]: number}>(
      `${this.apiUrl}/stocks/batch/decrement/${boutiqueid}`,
      body,
      this.httpOptions
    ).pipe(
      map(response => {
        console.log("appelle ${this.apiUrl}/stocks/batch/decrement/${boutiqueid}",response);
        const stock = response[String(productId)] || 0;
        this.stockCache.set(productId, { stock, timestamp: Date.now() });
        this.updateArticleStock(productId, stock);
        return stock;
      }),
      catchError(error => {
        console.error(`❌ Erreur récupération stock article ${productId}:`, error);
        const cached = this.stockCache.get(productId);
        return of(cached ? cached.stock : 0);
      })
    );
  }

  /**
   * ✅ VERSION CORRIGÉE: Obtient les stocks de plusieurs produits
   */
  getStocksProduits(productIds: number[]): Observable<Map<number, number>> {
    console.log('🔍 getStocksProduits appelé avec', productIds.length, 'articles');
    
    const stockMap = new Map<number, number>();
    const idsToFetch: number[] = [];

    // Vérifier le cache
    productIds.forEach(id => {
      const cached = this.stockCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        stockMap.set(id, cached.stock);
      } else {
        idsToFetch.push(id);
      }
    });

    if (idsToFetch.length === 0) {
      return of(stockMap);
    }

    console.log(`🌐 ${idsToFetch.length} stock(s) à récupérer du serveur`);

    // ✅ Construire le body au format attendu par le backend
    const items = idsToFetch.map(id => ({
      articleId: id,
      quantite: 0  // 0 = juste lire, pas décrémenter
    }));

    const boutiqueid = this.authService.getBoutiqueByUserSession();
    
    console.log('📤 Requête batch:', JSON.stringify(items));
    
    // ✅ CORRECTION: Ajouter httpOptions pour forcer Content-Type
    return this.http.post<{[key: string]: number}>(
      `${this.apiUrl}/stocks/batch/decrement/${boutiqueid}`, 
      items,
      this.httpOptions  // ✅ AJOUT
    ).pipe(
      map(response => {
        console.log('📥 Réponse batch:${this.apiUrl}/stocks/batch/decrement/${boutiqueid}', response);
        
        Object.entries(response).forEach(([id, newStock]) => {
          const articleId = parseInt(id);
          const stockValue = typeof newStock === 'number' ? newStock : 0;
          
          stockMap.set(articleId, stockValue);
          this.stockCache.set(articleId, { stock: stockValue, timestamp: Date.now() });
          this.updateArticleStock(articleId, stockValue);
        });
        
        return stockMap;
      }),
      catchError(error => {
        console.error('❌ Erreur getStocksProduits:', error);
        
        idsToFetch.forEach(id => {
          stockMap.set(id, 0);
        });
        
        return of(stockMap);
      })
    );
  }

  /**
   * ✅ VERSION CORRIGÉE: Diminue le stock après une vente
   */
  decrementStock(articleId: number, quantite: number): Observable<number> {
    console.log(`📉 Décrémentation stock article ${articleId} de ${quantite}`);
    const boutiqueid = this.authService.getBoutiqueByUserSession();
    
    const body = { quantite };
    console.log('📤 Body décrémentation:', JSON.stringify(body));
    
    // ✅ CORRECTION: Ajouter httpOptions
    return this.http.put<number>(
      `${this.apiUrl}/stock/${articleId}/${boutiqueid}/decrement`,
      body,
      this.httpOptions  // ✅ AJOUT
    ).pipe(
      tap(newStock => {
        console.log(`✅ Nouveau stock article ${articleId}: ${newStock}`,newStock);
        console.log(`✅ Nouveau stock article ${articleId}: ${newStock}`);
        this.stockCache.delete(articleId);
        this.updateArticleStock(articleId, newStock);
        this.checkStockAlert(articleId, newStock);
      }),
      catchError(error => {
        console.error(`❌ Erreur décrémentation stock ${articleId}:`, error);
        const cached = this.stockCache.get(articleId);
        const newStock = cached ? Math.max(0, cached.stock - quantite) : 0;
        this.updateArticleStock(articleId, newStock);
        return of(newStock);
      })
    );
  }

  /**
   * ✅ VERSION CORRIGÉE: Diminue les stocks de plusieurs articles
   */
  decrementStocksBatch(items: Array<{ articleId: number; quantite: number }>): Observable<Map<number, number>> {
    console.log('📉 Décrémentation batch de', items.length, 'articles');
    console.log('📤 Items:', JSON.stringify(items));
    
    const boutiqueid = this.authService.getBoutiqueByUserSession();
    
    // ✅ CORRECTION: Ajouter httpOptions
    return this.http.post<{[key: string]: number}>(
      `${this.apiUrl}/stocks/batch/decrement/${boutiqueid}`,
      items,
      this.httpOptions  // ✅ AJOUT
    ).pipe(
      map(response => {
        console.log('📥 Réponse batch:', response);
        const results = new Map<number, number>();
        
        Object.entries(response).forEach(([id, newStock]) => {
          const articleId = parseInt(id);
          const stockValue = typeof newStock === 'number' ? newStock : 0;
          
          results.set(articleId, stockValue);
          this.stockCache.delete(articleId);
          this.updateArticleStock(articleId, stockValue);
          this.checkStockAlert(articleId, stockValue);
          
          console.log(`✅ Article ${articleId}: nouveau stock ${stockValue}`);
        });
        
        return results;
      }),
      catchError(error => {
        console.error('❌ Erreur decrementStocksBatch:', error);
        console.error('❌ Détails:', error.error);
        
        const results = new Map<number, number>();
        items.forEach(item => {
          const cached = this.stockCache.get(item.articleId);
          const newStock = cached ? Math.max(0, cached.stock - item.quantite) : 0;
          results.set(item.articleId, newStock);
          this.updateArticleStock(item.articleId, newStock);
        });
        
        console.log('⚠️ Décrémentation locale uniquement');
        return of(results);
      })
    );
  }

  refreshAllStocks(): void {
    console.log('🔄 Rafraîchissement de tous les stocks');
    this.stockCache.clear();
  }

  /**
   * ✅ VERSION CORRIGÉE: Actualise le stock d'un article
   */
  refreshArticleStock(articleId: number, product?: Produit): Observable<Produit> {
    console.log(`🔄 Rafraîchissement stock article ${articleId}`);
    this.stockCache.delete(articleId);
    const boutiqueid = this.authService.getBoutiqueByUserSession();
    
    // ✅ Utiliser l'endpoint batch existant
    return this.http.post<Produit[]>(
      `${this.apiUrl}/produits/batch/${boutiqueid}`,
      [articleId],
      this.httpOptions
    ).pipe(
      map(articles => articles[0] || product),
      tap(article => {
        if (article) {
          this.stockCache.set(articleId, { 
            stock: article.stockFinal, 
            timestamp: Date.now() 
          });
          this.updateArticleStock(articleId, article.stockFinal);
          this.stockUpdatedSubject.next(article);
          this.checkStockAlert(articleId, article.stockFinal);
          
          console.log(`✅ Article ${articleId} rafraîchi: stock ${article.stockFinal}`);
        }
      }),
      catchError(error => {
        console.error(`❌ Erreur refresh article ${articleId}:`, error);
        if (product) {
          return of(product);
        }
        throw error;
      })
    );
  }

  /**
   * ✅ VERSION CORRIGÉE: Actualise les stocks de plusieurs articles
   */
  refreshArticlesStocks(articles: Produit[]): Observable<Produit[]> {
    console.log('🔄 Rafraîchissement de', articles.length, 'articles');
    articles.forEach(a => this.stockCache.delete(a.id!));
    
    const articleIds = articles
      .map(a => a.id)
      .filter((id): id is number => id !== undefined);

    const boutiqueid = this.authService.getBoutiqueByUserSession();
    
    // ✅ CORRECTION: Ajouter httpOptions
    return this.http.post<Produit[]>(
      `${this.apiUrl}/produits/batch/${boutiqueid}`,
      articleIds,
      this.httpOptions  // ✅ AJOUT
    ).pipe(
      tap(updatedArticles => {
        updatedArticles.forEach(article => {
          this.stockCache.set(article.id!, { 
            stock: article.stockFinal, 
            timestamp: Date.now() 
          });
          this.updateArticleStock(article.id!, article.stockFinal);
          this.stockUpdatedSubject.next(article);
          this.checkStockAlert(article.id!, article.stockFinal);
        });
        
        console.log(`✅ ${updatedArticles.length} articles rafraîchis`);
      }),
      catchError(error => {
        console.error('❌ Erreur refreshArticlesStocks:', error);
        return of(articles);
      })
    );
  }

  private checkStockAlert(articleId: number, stock: number): void {
    const alerts = this.stockAlertSubject.value;
    const existingAlertIndex = alerts.findIndex(a => a.articleId === articleId);

    if (stock === 0) {
      const alert: StockAlert = {
        articleId,
        libelle: `Article ${articleId}`,
        stockActuel: stock,
        seuilAlerte: this.SEUIL_ALERTE,
        type: 'RUPTURE'
      };
      if (existingAlertIndex > -1) {
        alerts[existingAlertIndex] = alert;
      } else {
        alerts.push(alert);
      }
      console.log(`🚨 RUPTURE DE STOCK: Article ${articleId}`);
    } else if (stock <= this.SEUIL_ALERTE && stock > 0) {
      const alert: StockAlert = {
        articleId,
        libelle: `Article ${articleId}`,
        stockActuel: stock,
        seuilAlerte: this.SEUIL_ALERTE,
        type: 'ALERTE'
      };
      if (existingAlertIndex > -1) {
        alerts[existingAlertIndex] = alert;
      } else {
        alerts.push(alert);
      }
      console.log(`⚠️ ALERTE STOCK BAS: Article ${articleId} (${stock})`);
    } else if (existingAlertIndex > -1) {
      alerts.splice(existingAlertIndex, 1);
      console.log(`✅ Stock normal: Article ${articleId} (${stock})`);
    }

    this.stockAlertSubject.next([...alerts]);
  }

  private updateArticleStock(articleId: number, stock: number): void {
    const currentStocks = this.articlesStockSubject.value;
    currentStocks.set(articleId, stock);
    this.articlesStockSubject.next(new Map(currentStocks));
  }

  getArticleStockFromCache(articleId: number): number | undefined {
    return this.articlesStockSubject.value.get(articleId);
  }

  setAlertThreshold(threshold: number): void {
    console.log(`ℹ️ Nouveau seuil d'alerte: ${threshold}`);
  }

  destroy(): void {
    console.log('🛑 Destruction StockManagementService');
    this.destroy$.next();
    this.destroy$.complete();
    this.stockCache.clear();
  }
}