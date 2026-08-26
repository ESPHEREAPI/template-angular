import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Boutique } from '../model/boutique';
import { Produit } from '../model/produit';
import { BarcodeGestionService, BarcodeCreateRequest } from './BarcodeGestion.service';
import { ConnectivityService } from './connectivity.service';
import { IndexedDbQueueService, QueueRecord } from './indexed-db-queue';
import { SyncStatusView } from '../compoment/sync-status-badge/sync-status-badge.component';

interface CodeBareOperation {
  operation: 'create' | 'update' | 'delete';
  /** Id backend reel - absent tant que l'operation porte sur une creation pas encore synchronisee. */
  entityId?: number;
  request?: BarcodeCreateRequest;
  codeBard?: string;
  /** Affichage optimiste uniquement (creation hors-ligne) - pas envoye au backend. */
  produitLibelle?: string;
  produitReference?: string;
}

/** Ligne a fusionner avec la page recue du serveur pendant qu'elle n'est pas encore synchronisee. */
export interface BarcodeRowView {
  id: number;
  codeBard: string;
  produitLibelle?: string;
  produitReference?: string;
  pending: boolean;
}

/**
 * Tolerance aux coupures reseau pour l'ecran "Code Bare" - CRUD complet
 * (contrairement a la Vente, creation seule) : si une association vient
 * d'etre creee hors-ligne (pas encore synchronisee, donc pas d'id reel) et
 * que l'utilisateur la modifie ou la supprime avant le retour de connexion,
 * on corrige/annule l'entree DEJA en file plutot que d'empiler une
 * operation contradictoire pour plus tard.
 *
 * Convention interne : une creation pas encore synchronisee recoit un id
 * NEGATIF (compteur decroissant) cote composant - le composant n'a donc
 * jamais besoin de distinguer "id reel" / "id local", seul ce service le
 * fait (via idLocalParId).
 */
@Injectable({ providedIn: 'root' })
export class CodeBareOfflineService {
  private readonly syncInterval = 120000;
  private readonly API_BASE_URL = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  private queue = new IndexedDbQueueService<CodeBareOperation>({
    dbName: 'CodeBareOfflineDB',
    storeName: 'operations'
  });

  private prochainIdLocal = -1;
  private idLocalParId = new Map<number, string>();

  private statusSubject = new BehaviorSubject<SyncStatusView>({
    isOnline: navigator.onLine,
    backendAvailable: false,
    pendingCount: 0,
    failedCount: 0,
    syncInProgress: false,
    itemLabel: 'association(s)'
  });

  readonly status$: Observable<SyncStatusView> = this.statusSubject.asObservable();

  constructor(
    private connectivity: ConnectivityService,
    private barcodeGestionService: BarcodeGestionService
  ) {
    this.connectivity.isOnline$.subscribe(isOnline => this.patchStatus({ isOnline }));
    this.connectivity.backendAvailable$.subscribe(backendAvailable => {
      this.patchStatus({ backendAvailable });
      if (backendAvailable) {
        this.syncPending();
      }
    });

    this.refreshCounts();
    setInterval(() => {
      if (this.connectivity.isOnline && this.connectivity.isBackendAvailable) {
        this.syncPending();
      }
    }, this.syncInterval);
  }

  /** A appeler une fois en ngOnInit - reutilise le GET boutiques deja necessaire a cet ecran comme ping. */
  configurerPing(): void {
    const url = `${this.API_BASE_URL}/boutique`;
    this.connectivity.setPingUrl(url);
    this.connectivity.checkBackendNow(url);
  }

  async creer(request: BarcodeCreateRequest, produitLibelle?: string, produitReference?: string): Promise<void> {
    if (this.connectivity.isOnline && this.connectivity.isBackendAvailable) {
      try {
        await this.envoyerCreation(request);
        return;
      } catch (error) {
        if (!this.estErreurReseau(error)) {
          throw error;
        }
        // Echec reseau malgre un statut "en ligne" (blip transitoire) -
        // on ne bloque pas l'utilisateur, la creation part en file.
      }
    }
    const localId = await this.queue.add({ operation: 'create', request, produitLibelle, produitReference });
    this.idPourLocalId(localId);
    await this.refreshCounts();
  }

  async modifier(id: number, codeBard: string): Promise<void> {
    const localId = this.idLocalParId.get(id);
    if (localId) {
      // Porte sur une creation pas encore synchronisee : on corrige son
      // payload en place plutot que d'ajouter une 2e operation.
      const record = (await this.queue.getAll()).find(r => r.localId === localId);
      if (record) {
        await this.queue.update(localId, { ...record.payload, request: { ...record.payload.request!, codeBard } });
      }
      return;
    }

    if (this.connectivity.isOnline && this.connectivity.isBackendAvailable) {
      try {
        await this.envoyerUpdate(id, codeBard);
        return;
      } catch (error) {
        if (!this.estErreurReseau(error)) {
          throw error;
        }
      }
    }
    await this.queue.add({ operation: 'update', entityId: id, codeBard });
    await this.refreshCounts();
  }

  async supprimer(id: number): Promise<void> {
    const localId = this.idLocalParId.get(id);
    if (localId) {
      // N'a jamais existe cote serveur - la retirer suffit.
      await this.queue.remove(localId);
      this.idLocalParId.delete(id);
      await this.refreshCounts();
      return;
    }

    if (this.connectivity.isOnline && this.connectivity.isBackendAvailable) {
      try {
        await this.envoyerDelete(id);
        return;
      } catch (error) {
        if (!this.estErreurReseau(error)) {
          throw error;
        }
      }
    }
    await this.queue.add({ operation: 'delete', entityId: id });
    await this.refreshCounts();
  }

  /** Lignes en attente a fusionner avec la page recue du serveur (voir BarcodeRowView). */
  async getPendingRows(): Promise<BarcodeRowView[]> {
    const pending = await this.queue.getPending();
    return pending
      .filter(r => r.payload.operation === 'create')
      .map(r => ({
        id: this.idPourLocalId(r.localId),
        codeBard: r.payload.request?.codeBard || '',
        produitLibelle: r.payload.produitLibelle,
        produitReference: r.payload.produitReference,
        pending: true
      }));
  }

  /** Ids reels ayant une modification ou suppression en attente, pour ajuster l'affichage des lignes serveur. */
  async getModificationsEnAttente(): Promise<Map<number, { codeBard?: string; supprime: boolean }>> {
    const pending = await this.queue.getPending();
    const map = new Map<number, { codeBard?: string; supprime: boolean }>();
    for (const record of pending) {
      const { operation, entityId, codeBard } = record.payload;
      if (entityId === undefined) {
        continue;
      }
      if (operation === 'delete') {
        map.set(entityId, { supprime: true });
      } else if (operation === 'update') {
        map.set(entityId, { codeBard, supprime: false });
      }
    }
    return map;
  }

  async forceSyncNow(): Promise<void> {
    await this.syncPending();
  }

  async retryFailed(localId: string): Promise<void> {
    await this.queue.retryFailed(localId);
    await this.refreshCounts();
  }

  // ==================== Cache listes de reference (formulaire hors-ligne) ====================

  cacheBoutiques(boutiques: Boutique[]): void {
    localStorage.setItem('codeBareOffline_boutiques', JSON.stringify(boutiques));
  }

  getCachedBoutiques(): Boutique[] {
    return this.lireCache('codeBareOffline_boutiques');
  }

  cacheArticlesBoutique(boutiqueId: number, articles: Produit[]): void {
    localStorage.setItem(`codeBareOffline_articles_${boutiqueId}`, JSON.stringify(articles));
  }

  getCachedArticlesBoutique(boutiqueId: number): Produit[] {
    return this.lireCache(`codeBareOffline_articles_${boutiqueId}`);
  }

  private lireCache<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ==================== Synchronisation ====================

  private async syncPending(): Promise<void> {
    if (this.statusSubject.value.syncInProgress) {
      return;
    }
    this.patchStatus({ syncInProgress: true });

    try {
      const pending = (await this.queue.getPending()).filter(r => !r.permanentFailure);
      for (const record of pending) {
        if (!this.connectivity.isBackendAvailable) {
          break;
        }
        try {
          await this.executerOperation(record);
          await this.queue.markSynced(record.localId);
          this.idLocalParId.forEach((localId, id) => {
            if (localId === record.localId) {
              this.idLocalParId.delete(id);
            }
          });
        } catch (error: any) {
          await this.queue.incrementAttempt(record.localId, this.messageErreur(error));
        }
        await this.delay(300);
      }
    } finally {
      this.patchStatus({ syncInProgress: false, lastSync: new Date() });
      await this.refreshCounts();
    }
  }

  private async executerOperation(record: QueueRecord<CodeBareOperation>): Promise<void> {
    const { operation, entityId, request, codeBard } = record.payload;
    if (operation === 'create' && request) {
      await this.envoyerCreation(request);
    } else if (operation === 'update' && entityId !== undefined && codeBard !== undefined) {
      await this.envoyerUpdate(entityId, codeBard);
    } else if (operation === 'delete' && entityId !== undefined) {
      await this.envoyerDelete(entityId);
    }
  }

  private envoyerCreation(request: BarcodeCreateRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.barcodeGestionService.create(request).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private envoyerUpdate(id: number, codeBard: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.barcodeGestionService.update(id, codeBard).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private envoyerDelete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.barcodeGestionService.delete(id).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private idPourLocalId(localId: string): number {
    for (const [id, existingLocalId] of this.idLocalParId.entries()) {
      if (existingLocalId === localId) {
        return id;
      }
    }
    const id = this.prochainIdLocal--;
    this.idLocalParId.set(id, localId);
    return id;
  }

  /**
   * status===0 (ou absent) = aucune reponse HTTP recue (coupure, CORS,
   * timeout) - seul cas ou l'on peut affirmer que le backend n'a pas vu la
   * requete. Tout code recu, y compris 500, signifie qu'il l'a traitee et
   * rejetee - ne jamais confondre avec une panne reseau (voir vente-articles-offline.service.ts
   * pour le raisonnement complet sur ce choix).
   */
  private estErreurReseau(error: any): boolean {
    return error?.status === 0 || error?.status === undefined;
  }

  private messageErreur(error: any): string {
    return error?.error?.message || error?.message || 'Erreur inconnue';
  }

  private async refreshCounts(): Promise<void> {
    const pending = await this.queue.getPending();
    const failed = pending.filter(r => r.permanentFailure);
    this.patchStatus({
      pendingCount: pending.length - failed.length,
      failedCount: failed.length
    });
  }

  private patchStatus(partial: Partial<SyncStatusView>): void {
    this.statusSubject.next({ ...this.statusSubject.value, ...partial });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
