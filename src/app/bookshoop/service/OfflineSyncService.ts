// src/app/service/OfflineSyncService.ts
// ✅ VERSION CORRIGÉE - Diagnostic backend amélioré

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, fromEvent, merge, of, throwError, firstValueFrom } from 'rxjs';
import { filter, switchMap, catchError, timeout } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { User } from '../model/user';
import { environment } from '../../../environments/environment';

export interface VenteOffline {
  id?: number;
  localId: string;
  numeroTicket: string;
  date: Date;
  items: any[];
  montantTotal: number;
  montantNet: number;
  typePaiement: string;
  // Paiement mixte : lignes individuelles (ex. especes + Orange Money + bon
  // d'achat). Si absent, le backend retombe sur typePaiement/montantNet.
  paiements?: { typePaiement: string; montant: number; reference?: string }[];
  montantRecu: number;
  monnaieRendue: number;
  remise: number;
  client?: any;
  userinsert: string;
  statut: string;
  synced: boolean;
  tentativeSync: number;
  numerocommande?: number;
  errorMessage?: string;
  lastSyncAttempt?: Date;
  // Vente ayant atteint maxRetries : n'est plus retentee automatiquement,
  // reste visible pour intervention manuelle (voir retryFailedSale()).
  permanentFailure?: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  backendAvailable: boolean;
  pendingSales: number;
  failedSales: number;
  lastSync?: Date;
  syncInProgress: boolean;
  lastError?: string;
}

export interface ConnectionStatus {
  internet: boolean;
  backend: boolean;
  lastCheck: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private readonly dbName = 'VenteOfflineDB';
  private readonly dbVersion = 3;
  private readonly syncInterval = 120000;
  private readonly backendCheckInterval = 30000;
  private readonly requestTimeout = 15000; // ✅ Augmenté à 15s
  private readonly maxRetries = 3;
  
  private db!: IDBDatabase;
  private dbInitialized = false;
  public boutiqueid!: number;
  user: User | null = null;
  userSession: any;
  
  // ✅ CORRECTION : Construire l'URL complète avec environment
  private readonly API_BASE_URL = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  
  private syncStatus$ = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    backendAvailable: false,
    pendingSales: 0,
    failedSales: 0,
    syncInProgress: false
  });

  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    internet: navigator.onLine,
    backend: false,
    lastCheck: new Date()
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initialize();
  }

  // ==================== INITIALISATION ====================
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initialisation OfflineSyncService');
      
      // ✅ Récupérer l'utilisateur
      this.userSession = this.authService.currentUserValue;
      if (this.userSession && this.userSession.usersDTO) {
        this.user = this.userSession.usersDTO;
        console.log('👤 Utilisateur:', this.user?.userName);
        
        if (this.user?.boutiqueid) {
          this.boutiqueid = this.user.boutiqueid;
          console.log('🏪 Boutique ID configuré:', this.boutiqueid);
        } else {
          console.warn('⚠️ Aucun boutiqueid trouvé');
          this.boutiqueid = 0;
        }
      } else {
        console.error('❌ Aucun utilisateur connecté !');
      }
      
      await this.initDatabase();
      
      // ✅ Vérifier le backend APRÈS avoir le boutiqueid
      if (this.boutiqueid > 0) {
        console.log('🔍 Vérification backend...');
        await this.checkBackendAvailability();
      } else {
        console.warn('⚠️ Boutique ID non défini, skip vérification backend');
      }
      
      this.monitorConnectivity();
      this.startPeriodicSync();
      this.startBackendHealthCheck();
      
      console.log('✅ OfflineSyncService initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation:', error);
      this.updateSyncStatus({ 
        backendAvailable: false,
        lastError: 'Erreur initialisation'
      });
    }
  }

  // ==================== BASE DE DONNÉES ====================
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ Erreur IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.dbInitialized = true;
        console.log('✅ IndexedDB initialisée');
        this.updatePendingCount();
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        console.log('🔄 Upgrade IndexedDB vers version', this.dbVersion);

        if (db.objectStoreNames.contains('ventes')) {
          db.deleteObjectStore('ventes');
        }

        const venteStore = db.createObjectStore('ventes', { keyPath: 'localId' });
        venteStore.createIndex('synced', 'synced', { unique: false });
        venteStore.createIndex('date', 'date', { unique: false });
        venteStore.createIndex('numeroTicket', 'numeroTicket', { unique: false });
        venteStore.createIndex('tentativeSync', 'tentativeSync', { unique: false });

        if (!db.objectStoreNames.contains('articles')) {
          const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
          articleStore.createIndex('reference', 'reference', { unique: false });
          articleStore.createIndex('libelle', 'libelle', { unique: false });
        }

        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientStore.createIndex('nom', 'nom', { unique: false });
        }

        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      };
    });
  }

  // ==================== BACKEND (VERSION CORRIGÉE) ====================
  
  /**
   * ✅ VERSION CORRIGÉE : Vérification backend avec diagnostic détaillé
   */
  private async checkBackendAvailability(): Promise<boolean> {
    console.log('═══════════════════════════════════════');
    console.log('🔍 VÉRIFICATION BACKEND');
    console.log('═══════════════════════════════════════');
    
    try {
      // ✅ Vérifications préalables
      if (!this.boutiqueid || this.boutiqueid === 0) {
        console.error('❌ Boutique ID non défini:', this.boutiqueid);
        this.updateConnectionStatus({ backend: false, lastCheck: new Date() });
        this.updateSyncStatus({ 
          backendAvailable: false,
          lastError: 'Boutique ID manquant'
        });
        return false;
      }
      
      // ✅ Construction de l'URL
      const url = `${this.API_BASE_URL}/top-articles/${this.boutiqueid}`;
      console.log('📡 URL de test:', url);
      console.log('   Environment API URL:', environment.apiUrl);
      console.log('   Boutique ID:', this.boutiqueid);
      
      // ✅ Appel HTTP avec timeout augmenté
      console.log('⏳ Envoi requête (timeout: 15s)...');
      const startTime = Date.now();
      
      const healthCheck = await this.http.get(url, { 
        observe: 'response'
      })
      .pipe(
        timeout(15000), // ✅ 15 secondes
        catchError((error: HttpErrorResponse) => {
          const duration = Date.now() - startTime;
          console.error('❌ Erreur HTTP après', duration, 'ms');
          console.error('   Status:', error.status);
          console.error('   Message:', error.message);
          console.error('   URL:', error.url);
          
          if (error.status === 0) {
            console.error('   → Probable: CORS, réseau, ou backend down');
          } else if (error.status === 404) {
            console.error('   → Endpoint non trouvé');
          } else if (error.status === 401 || error.status === 403) {
            console.error('   → Problème d\'authentification');
          }
          
          return of(null);
        })
      )
      .toPromise();

      const duration = Date.now() - startTime;
      const isAvailable = healthCheck !== null && healthCheck?.status === 200;
      
      if (isAvailable) {
        console.log('✅ Backend accessible en', duration, 'ms');
        console.log('   Status:', healthCheck.status);
        console.log('   Headers:', healthCheck.headers.keys());
      } else {
        console.error('❌ Backend inaccessible');
      }
      
      // ✅ Mettre à jour les statuts
      this.updateConnectionStatus({
        backend: isAvailable,
        lastCheck: new Date()
      });

      this.updateSyncStatus({ 
        backendAvailable: isAvailable,
        lastError: isAvailable ? undefined : 'Backend inaccessible'
      });

      console.log('═══════════════════════════════════════');
      console.log(isAvailable ? '✅ BACKEND OK' : '❌ BACKEND KO');
      console.log('═══════════════════════════════════════');
      
      return isAvailable;

    } catch (error: any) {
      console.error('❌ Exception lors de la vérification:', error);
      console.error('   Type:', error.constructor.name);
      console.error('   Message:', error.message);
      
      this.updateConnectionStatus({
        backend: false,
        lastCheck: new Date()
      });

      this.updateSyncStatus({ 
        backendAvailable: false,
        lastError: error.message || 'Erreur inconnue'
      });

      console.log('═══════════════════════════════════════');
      console.log('❌ BACKEND KO (Exception)');
      console.log('═══════════════════════════════════════');
      
      return false;
    }
  }

  private startBackendHealthCheck(): void {
    timer(0, this.backendCheckInterval)
      .pipe(
        filter(() => navigator.onLine && this.boutiqueid > 0),
        switchMap(() => this.checkBackendAvailability())
      )
      .subscribe({
        next: (isAvailable) => {
          if (isAvailable && this.syncStatus$.value.pendingSales > 0) {
            console.log('🔄 Backend accessible - Sync auto');
            this.syncPendingSales().subscribe();
          }
        }
      });
  }

  // ==================== CONNECTIVITÉ ====================
  private monitorConnectivity(): void {
    const online$ = fromEvent(window, 'online');
    const offline$ = fromEvent(window, 'offline');

    merge(online$, offline$).subscribe(() => {
      const isOnline = navigator.onLine;
      
      console.log(isOnline ? '🟢 Internet rétabli' : '🔴 Internet perdu');
      
      this.updateConnectionStatus({
        internet: isOnline,
        lastCheck: new Date()
      });

      this.updateSyncStatus({ isOnline });

      if (isOnline && this.boutiqueid > 0) {
        console.log('🔍 Vérification backend après reconnexion...');
        this.checkBackendAvailability().then(backendOk => {
          if (backendOk) {
            console.log('🔄 Sync après reconnexion');
            this.syncPendingSales().subscribe();
          }
        });
      } else {
        this.updateSyncStatus({ 
          backendAvailable: false,
          lastError: 'Pas de connexion'
        });
      }
    });
  }

  // ==================== SYNC PÉRIODIQUE ====================
  private startPeriodicSync(): void {
    timer(this.syncInterval, this.syncInterval)
      .pipe(
        filter(() => {
          const status = this.syncStatus$.value;
          return status.isOnline && 
                 status.backendAvailable && 
                 status.pendingSales > 0 && 
                 !status.syncInProgress;
        }),
        switchMap(() => this.syncPendingSales())
      )
      .subscribe({
        next: (result) => console.log('✅ Sync périodique:', result),
        error: (error) => console.error('❌ Erreur sync périodique:', error)
      });
  }

  // ==================== SAUVEGARDE VENTE ====================
  async saveVenteLocally(vente: VenteOffline): Promise<string> {
    try {
      await this.ensureDBReady();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['ventes'], 'readwrite');
        const store = transaction.objectStore('ventes');

        vente.localId = this.generateLocalId();
        vente.synced = false;
        vente.tentativeSync = 0;
        vente.date = new Date();

        console.log('💾 Sauvegarde vente:', vente.numeroTicket);

        const request = store.add(vente);

        request.onsuccess = () => {
          console.log('✅ Vente sauvegardée:', vente.numeroTicket);
          this.updatePendingCount();
          
          if (this.canAttemptSync()) {
            console.log('🔄 Tentative sync immédiate');
            this.syncPendingSales().subscribe();
          }
          
          resolve(vente.localId);
        };

        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('❌ Erreur saveVenteLocally:', error);
      throw error;
    }
  }

  // ==================== RÉCUPÉRATION VENTES ====================
  async getPendingSales(): Promise<VenteOffline[]> {
    try {
      await this.ensureDBReady();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['ventes'], 'readonly');
        const store = transaction.objectStore('ventes');
        const request = store.openCursor();
        const pendingSales: VenteOffline[] = [];

        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const vente = cursor.value as VenteOffline;
            if (vente.synced === false) {
              pendingSales.push(vente);
            }
            cursor.continue();
          } else {
            console.log(`📋 ${pendingSales.length} vente(s) en attente`);
            resolve(pendingSales);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Erreur getPendingSales:', error);
      return [];
    }
  }

  // ==================== SYNCHRONISATION ====================
  syncPendingSales(): Observable<any> {
    return new Observable(observer => {
      if (!this.canAttemptSync()) {
        const reason = this.getCannotSyncReason();
        console.log('⏸️ Sync ignorée:', reason);
        observer.next({
          success: false,
          message: reason,
          synced: 0,
          errors: 0,
          total: 0
        });
        observer.complete();
        return;
      }

      this.updateSyncStatus({
        syncInProgress: true,
        lastError: undefined
      });

      this.getPendingSales().then(async (allPending) => {
        // Les ventes ayant atteint maxRetries ne sont plus retentees
        // automatiquement - elles restent visibles (failedSales) en
        // attente d'une intervention manuelle via retryFailedSale().
        const ventes = allPending.filter(v => !v.permanentFailure);

        if (ventes.length === 0) {
          this.updateSyncStatus({
            syncInProgress: false,
            lastSync: new Date()
          });
          observer.next({ success: true, synced: 0, errors: 0, total: 0 });
          observer.complete();
          return;
        }

        console.log(`🔄 Sync de ${ventes.length} vente(s)`);

        let syncedCount = 0;
        let errors = 0;

        for (const vente of ventes) {
          try {
            const backendOk = await this.checkBackendAvailability();
            if (!backendOk) {
              console.log('⚠️ Backend inaccessible - Arrêt sync');
              errors = ventes.length - syncedCount;
              break;
            }

            const result = await this.sendVenteToBackend(vente);

            if (result.success) {
              await this.markAsSynced(vente.localId);
              syncedCount++;
            } else {
              await this.incrementSyncAttempt(vente.localId, result.errorMessage || 'Échec envoi');
              errors++;
            }
          } catch (error: any) {
            console.error(`❌ Erreur sync ${vente.numeroTicket}:`, error);
            await this.incrementSyncAttempt(vente.localId, error.message);
            errors++;
          }

          await this.delay(500);
        }

        const result = {
          success: syncedCount > 0,
          synced: syncedCount,
          errors,
          total: ventes.length
        };

        this.updateSyncStatus({ 
          syncInProgress: false,
          lastSync: syncedCount > 0 ? new Date() : this.syncStatus$.value.lastSync,
          lastError: errors > 0 ? `${errors} erreur(s)` : undefined
        });
        
        await this.updatePendingCount();
        
        observer.next(result);
        observer.complete();

      }).catch(error => {
        console.error('❌ Erreur critique sync:', error);
        this.updateSyncStatus({ 
          syncInProgress: false,
          lastError: 'Erreur critique'
        });
        observer.error(error);
      });
    });
  }

  // ==================== ENVOI AU BACKEND ====================
  private async sendVenteToBackend(vente: any): Promise<{ success: boolean; errorMessage?: string }> {
    if (!vente.numeroTicket || !vente.items || vente.items.length === 0) {
      console.error('❌ Données vente invalides');
      return { success: false, errorMessage: 'Données de vente invalides' };
    }

    const numeroCommande = vente.numerocommande || 0;
    const url = `${this.API_BASE_URL}/vente/${numeroCommande}`;
    
    const venteData = {
      numeroTicket: vente.numeroTicket.trim(),
      date: new Date(vente.date).toISOString(),
      items: vente.items.map((item: any) => ({
        article: { id: Number(item.article?.id || item.articleId) },
        quantite: Number(item.quantite || 0),
        prixUnitaire: Number(item.prixUnitaire || 0),
        montantTotal: Number(item.montantTotal || 0)
      })),
      montantTotal: Number(vente.montantTotal || 0),
      montantNet: Number(vente.montantNet || 0),
      typePaiement: (vente.typePaiement || 'ESPECES').toUpperCase(),
      paiements: Array.isArray(vente.paiements) && vente.paiements.length > 0
        ? vente.paiements.map((p: any) => ({
            typePaiement: String(p.typePaiement).toUpperCase(),
            montant: Number(p.montant || 0),
            reference: p.reference || undefined
          }))
        : undefined,
      montantRecu: Number(vente.montantRecu || 0),
      monnaieRendue: Number(vente.monnaieRendue || 0),
      remise: Number(vente.remise || 0),
      client: vente.client,
      userinsert: vente.userinsert.trim(),
      statut: (vente.statut || 'TERMINEE').toUpperCase(),
      boutiqueid: this.boutiqueid
    };

    console.log('📤 Envoi vente:', vente.numeroTicket);

    try {
      const response = await firstValueFrom(
        this.http.post<any>(url, venteData).pipe(
          timeout(this.requestTimeout),
          catchError((error: HttpErrorResponse) => {
            console.error('❌ Erreur HTTP:', error.status, error.message);
            return throwError(() => error);
          })
        )
      );

      console.log('✅ Vente synchronisée:', response);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Échec synchronisation:', error);
      // Le backend renvoie {success:false, message:"..."} (GlobalExceptionHandler)
      // ou un ErrorDetails avec un champ "message" - on recupere la vraie raison
      // (ex: "Stock insuffisant pour X") plutot que de la perdre.
      const backendMessage = error?.error?.message || error?.message || 'Erreur inconnue';
      return { success: false, errorMessage: backendMessage };
    }
  }

  // ==================== CACHE ====================
  async cacheArticles(articles: any[]): Promise<void> {
    try {
      await this.ensureDBReady();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['articles'], 'readwrite');
        const store = transaction.objectStore('articles');
        store.clear();
        
        articles.forEach(article => {
          if (article.stockFinal === undefined) {
            article.stockFinal = 0;
          }
          store.put(article);
        });

        transaction.oncomplete = () => {
          console.log(`✅ ${articles.length} articles en cache`);
          resolve();
        };
        
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('❌ Erreur cache articles:', error);
    }
  }

  async getCachedArticles(): Promise<any[]> {
    try {
      await this.ensureDBReady();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Erreur getCachedArticles:', error);
      return [];
    }
  }

  async cacheClients(clients: any[]): Promise<void> {
    try {
      await this.ensureDBReady();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['clients'], 'readwrite');
        const store = transaction.objectStore('clients');
        store.clear();
        clients.forEach(client => store.put(client));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('❌ Erreur cache clients:', error);
    }
  }

  async getCachedClients(): Promise<any[]> {
    try {
      await this.ensureDBReady();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['clients'], 'readonly');
        const store = transaction.objectStore('clients');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Erreur getCachedClients:', error);
      return [];
    }
  }

  // ==================== UTILITAIRES ====================
  private async markAsSynced(localId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['ventes'], 'readwrite');
      const store = transaction.objectStore('ventes');
      const request = store.get(localId);

      request.onsuccess = () => {
        const vente = request.result;
        if (vente) {
          vente.synced = true;
          store.put(vente).onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async incrementSyncAttempt(localId: string, errorMessage: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['ventes'], 'readwrite');
      const store = transaction.objectStore('ventes');
      const request = store.get(localId);

      request.onsuccess = () => {
        const vente = request.result;
        if (vente) {
          vente.tentativeSync = (vente.tentativeSync || 0) + 1;
          vente.errorMessage = errorMessage;
          vente.lastSyncAttempt = new Date();
          if (vente.tentativeSync >= this.maxRetries) {
            vente.permanentFailure = true;
            console.warn(`⛔ Vente ${vente.numeroTicket} : echec definitif apres ${vente.tentativeSync} tentatives - ${errorMessage}`);
          }
          store.put(vente).onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Relance manuellement une vente marquee en echec definitif (remet le
   * compteur a zero et l'inclut a nouveau dans le prochain cycle de sync).
   */
  async retryFailedSale(localId: string): Promise<void> {
    await this.ensureDBReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['ventes'], 'readwrite');
      const store = transaction.objectStore('ventes');
      const request = store.get(localId);

      request.onsuccess = () => {
        const vente = request.result;
        if (vente) {
          vente.permanentFailure = false;
          vente.tentativeSync = 0;
          vente.errorMessage = undefined;
          store.put(vente).onsuccess = () => {
            this.updatePendingCount();
            resolve();
          };
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ventes ayant atteint maxRetries - necessitent une intervention manuelle
   * (stock reellement insuffisant, donnees invalides, etc.), ne sont plus
   * retentees automatiquement.
   */
  async getFailedSales(): Promise<VenteOffline[]> {
    const pending = await this.getPendingSales();
    return pending.filter(v => v.permanentFailure === true);
  }

  private canAttemptSync(): boolean {
    const status = this.syncStatus$.value;
    return status.isOnline && 
           status.backendAvailable && 
           !status.syncInProgress &&
           this.boutiqueid > 0;
  }

  private getCannotSyncReason(): string {
    const status = this.syncStatus$.value;
    if (!status.isOnline) return 'Pas de connexion Internet';
    if (this.boutiqueid === 0) return 'Boutique ID non défini';
    if (!status.backendAvailable) return 'Backend inaccessible';
    if (status.syncInProgress) return 'Sync en cours';
    return 'Raison inconnue';
  }

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async ensureDBReady(): Promise<void> {
    if (!this.dbInitialized || !this.db) {
      await this.initDatabase();
    }
  }

  private async updatePendingCount(): Promise<void> {
    try {
      const ventes = await this.getPendingSales();
      const failed = ventes.filter(v => v.permanentFailure === true).length;
      this.updateSyncStatus({
        pendingSales: ventes.length - failed,
        failedSales: failed
      });
    } catch (error) {
      console.error('❌ Erreur updatePendingCount:', error);
    }
  }

  private updateSyncStatus(partial: Partial<SyncStatus>): void {
    const current = this.syncStatus$.value;
    this.syncStatus$.next({ ...current, ...partial });
  }

  private updateConnectionStatus(partial: Partial<ConnectionStatus>): void {
    const current = this.connectionStatus$.value;
    this.connectionStatus$.next({ ...current, ...partial });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== API PUBLIQUE ====================
  getSyncStatus(): Observable<SyncStatus> {
    return this.syncStatus$.asObservable();
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  isBackendAvailable(): boolean {
    return this.syncStatus$.value.backendAvailable;
  }

  async forceBackendCheck(): Promise<boolean> {
    return await this.checkBackendAvailability();
  }

  forceSyncNow(): Observable<any> {
    if (!this.canAttemptSync()) {
      const reason = this.getCannotSyncReason();
      return of({ 
        success: false, 
        message: reason,
        synced: 0,
        errors: 0,
        total: 0
      });
    }
    return this.syncPendingSales();
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Diagnostic complet
   */
  async diagnosticComplet(): Promise<void> {
    console.clear();
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   DIAGNOSTIC OFFLINE SYNC SERVICE     ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('');
    
    console.log('📊 CONFIGURATION');
    console.log('   Environment API URL:', environment.apiUrl);
    console.log('   API Base URL:', this.API_BASE_URL);
    console.log('   Boutique ID:', this.boutiqueid);
    console.log('   Utilisateur:', this.user?.userName || 'Non défini');
    console.log('');
    
    console.log('🌐 CONNECTIVITÉ');
    console.log('   Navigator Online:', navigator.onLine);
    console.log('   Backend Available:', this.syncStatus$.value.backendAvailable);
    console.log('   Last Check:', this.connectionStatus$.value.lastCheck);
    console.log('');
    
    console.log('📋 VENTES');
    const pending = await this.getPendingSales();
    console.log('   En attente:', pending.length);
    console.log('   Sync en cours:', this.syncStatus$.value.syncInProgress);
    console.log('');
    
    console.log('🔍 TEST BACKEND');
    const isOk = await this.checkBackendAvailability();
    console.log('   Résultat:', isOk ? '✅ OK' : '❌ KO');
    console.log('');
    
    console.log('╚═══════════════════════════════════════╝');
  }
}