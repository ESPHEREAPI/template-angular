import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Observable, Subject, timer } from 'rxjs';
import { switchMap, takeUntil, tap, catchError, filter } from 'rxjs/operators';
import { BarcodeService } from './barcode.service';
import { Produit } from '../model/produit';

/**
 * Service de rafraîchissement automatique des stocks
 * Utilise un système de polling intelligent qui :
 * - Rafraîchit automatiquement les stocks sans alourdir l'application
 * - Adapte la fréquence selon l'activité de l'utilisateur
 * - Peut être activé/désactivé selon les besoins
 */
@Injectable({
  providedIn: 'root'
})
export class StockRefreshService implements OnDestroy {
  
  // Intervalles de rafraîchissement en millisecondes
  private readonly REFRESH_INTERVALS = {
    ACTIVE: 30000,      // 30 secondes quand l'utilisateur est actif
    IDLE: 120000,       // 2 minutes quand l'utilisateur est inactif
    BACKGROUND: 300000  // 5 minutes en arrière-plan
  };

  // Sujet pour arrêter les subscriptions
  private destroy$ = new Subject<void>();
  private refreshTimer$ = new Subject<void>();
  
  // État du service
  private isEnabled$ = new BehaviorSubject<boolean>(false);
  private currentInterval = this.REFRESH_INTERVALS.ACTIVE;
  private lastActivityTime = Date.now();
  
  // Cache des stocks actuels
  private stocksCache = new Map<number, number>();
  
  // Émetteur d'événements pour les changements de stock
  private stockUpdated$ = new Subject<{ productId: number, oldStock: number, newStock: number }>();
  
  // Observable public pour écouter les mises à jour de stock
  public onStockUpdated$ = this.stockUpdated$.asObservable();

  constructor(private barcodeService: BarcodeService) {
    this.initActivityTracking();
  }

  /**
   * Démarre le rafraîchissement automatique des stocks
   */
  start(): void {
    if (this.isEnabled$.value) {
      console.log('📊 Service de rafraîchissement des stocks déjà actif');
      return;
    }

    console.log('🚀 Démarrage du rafraîchissement automatique des stocks');
    this.isEnabled$.next(true);
    this.startRefreshCycle();
  }

  /**
   * Arrête le rafraîchissement automatique
   */
  stop(): void {
    console.log('⏹️ Arrêt du rafraîchissement automatique des stocks');
    this.isEnabled$.next(false);
    this.refreshTimer$.next();
  }

  /**
   * Rafraîchit immédiatement les stocks d'une liste de produits
   */
  refreshStocks(products: Produit[]): Observable<void> {
    return new Observable(observer => {
      const refreshPromises = products.map(product => 
        this.refreshSingleProduct(product).toPromise()
      );

      Promise.all(refreshPromises)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          console.error('❌ Erreur lors du rafraîchissement des stocks:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Rafraîchit le stock d'un seul produit
   */
  private refreshSingleProduct(product: Produit): Observable<number> {
    return this.barcodeService.getStockcurrentProduit(product.id ?? 0).pipe(
      tap(newStock => {
        const oldStock = this.stocksCache.get(product.id ?? 0) ?? product.stockFinal;
        
        // Mise à jour du cache
        this.stocksCache.set(product.id?? 0, newStock);
        
        // Mise à jour du produit
        product.stockFinal = newStock;
        
        // Émettre un événement si le stock a changé
        if (oldStock !== newStock) {
          console.log(`📦 Stock mis à jour pour "${product.libelle}": ${oldStock} → ${newStock}`);
          this.stockUpdated$.next({
            productId: product.id??0,
            oldStock: oldStock,
            newStock: newStock
          });
        }
      }),
      catchError(error => {
        console.error(`❌ Erreur refresh stock produit ${product.id}:`, error);
        return [];
      })
    );
  }

  /**
   * Cycle de rafraîchissement automatique
   */
  private startRefreshCycle(): void {
    this.isEnabled$.pipe(
      filter(enabled => enabled),
      switchMap(() => timer(0, this.currentInterval)),
      takeUntil(this.refreshTimer$),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.adjustRefreshInterval();
    });
  }

  /**
   * Ajuste l'intervalle de rafraîchissement selon l'activité
   */
  private adjustRefreshInterval(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    
    let newInterval: number;
    
    if (timeSinceLastActivity < 60000) { // Moins d'1 minute
      newInterval = this.REFRESH_INTERVALS.ACTIVE;
    } else if (timeSinceLastActivity < 300000) { // Moins de 5 minutes
      newInterval = this.REFRESH_INTERVALS.IDLE;
    } else {
      newInterval = this.REFRESH_INTERVALS.BACKGROUND;
    }
    
    // Redémarrer le cycle si l'intervalle a changé
    if (newInterval !== this.currentInterval) {
      console.log(`⏱️ Changement d'intervalle de rafraîchissement: ${this.currentInterval/1000}s → ${newInterval/1000}s`);
      this.currentInterval = newInterval;
      this.refreshTimer$.next();
      this.startRefreshCycle();
    }
  }

  /**
   * Initialise le suivi de l'activité utilisateur
   */
  private initActivityTracking(): void {
    // Événements qui indiquent une activité utilisateur
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.lastActivityTime = Date.now();
      }, { passive: true });
    });
  }

  /**
   * Obtient l'état actuel du service
   */
  isEnabled(): boolean {
    return this.isEnabled$.value;
  }

  /**
   * Obtient l'intervalle actuel de rafraîchissement (en secondes)
   */
  getCurrentInterval(): number {
    return this.currentInterval / 1000;
  }

  /**
   * Nettoie le cache des stocks
   */
  clearCache(): void {
    this.stocksCache.clear();
    console.log('🗑️ Cache des stocks vidé');
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.next();
    this.destroy$.complete();
    this.stockUpdated$.complete();
  }
}