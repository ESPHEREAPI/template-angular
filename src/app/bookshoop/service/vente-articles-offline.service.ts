import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { BarcodeService } from './barcode.service';
import { ConnectivityService } from './connectivity.service';
import { IndexedDbQueueService, QueueRecord } from './indexed-db-queue';
import { SyncStatusView } from '../compoment/sync-status-badge/sync-status-badge.component';
import { Vente } from '../model/vente';

export interface VenteArticlesOfflinePayload {
  vente: Vente;
  numerocommande: number;
}

/**
 * Tolerance aux coupures reseau pour l'ecran "Vente Articles" - meme
 * principe que OfflineSyncService.ts (deja en production pour l'ecran
 * "Vente Art./CodeBare"), reconstruit sur le socle partage
 * (ConnectivityService + IndexedDbQueueService) plutot que sur une
 * copie du code existant.
 *
 * Une vente ne se modifie/supprime jamais une fois enregistree - la file
 * ne contient donc que des creations (contrairement a CodeBareOfflineService).
 */
@Injectable({ providedIn: 'root' })
export class VenteArticlesOfflineService {
  private readonly syncInterval = 120000;
  private readonly API_BASE_URL = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  private queue = new IndexedDbQueueService<VenteArticlesOfflinePayload>({
    dbName: 'VenteArticlesOfflineDB',
    storeName: 'ventes'
  });

  private boutiqueid = 0;
  private statusSubject = new BehaviorSubject<SyncStatusView>({
    isOnline: navigator.onLine,
    backendAvailable: false,
    pendingCount: 0,
    failedCount: 0,
    syncInProgress: false,
    itemLabel: 'vente(s)'
  });

  readonly status$: Observable<SyncStatusView> = this.statusSubject.asObservable();

  constructor(
    private connectivity: ConnectivityService,
    private barcodeService: BarcodeService,
    private authService: AuthService
  ) {
    this.boutiqueid = this.authService.currentUserDTO?.boutiqueid || 0;

    if (this.boutiqueid > 0) {
      this.connectivity.setPingUrl(`${this.API_BASE_URL}/top-articles/${this.boutiqueid}`);
    }

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

  /**
   * Enregistre la vente : envoi direct si le backend est joignable, sinon
   * mise en file locale. Retourne venteid=0 (sentinelle "pas encore
   * synchronisee", meme convention que vente.component.ts) quand hors-ligne.
   */
  async enregistrer(vente: Vente, numerocommande: number): Promise<{ venteid: number }> {
    if (this.connectivity.isOnline && this.connectivity.isBackendAvailable) {
      try {
        const venteid = await this.envoyerAuBackend({ vente, numerocommande });
        return { venteid };
      } catch (error) {
        // Echec reseau (pas un rejet metier, ex. stock insuffisant, qui
        // doit remonter tel quel a l'appelant) -> bascule sur la file.
        if (this.estEchecMetier(error)) {
          throw error;
        }
      }
    }

    await this.queue.add({ vente, numerocommande });
    await this.refreshCounts();
    return { venteid: 0 };
  }

  async forceSyncNow(): Promise<void> {
    await this.syncPending();
  }

  async retryFailed(localId: string): Promise<void> {
    await this.queue.retryFailed(localId);
    await this.refreshCounts();
  }

  private async syncPending(): Promise<void> {
    if (this.statusSubject.value.syncInProgress) {
      return;
    }
    this.patchStatus({ syncInProgress: true });

    try {
      const pending = (await this.queue.getPending()).filter(r => !r.permanentFailure);
      for (const record of pending) {
        const backendOk = this.connectivity.isBackendAvailable;
        if (!backendOk) {
          break;
        }
        try {
          await this.envoyerAuBackend(record.payload);
          await this.queue.markSynced(record.localId);
        } catch (error: any) {
          // Qu'il s'agisse d'une panne reseau ou d'un rejet metier (ex.
          // stock insuffisant au moment de la sync), la vente reste en
          // file - visible pour intervention manuelle une fois maxRetries
          // atteint (voir getFailed()/retryFailed()).
          await this.queue.incrementAttempt(record.localId, this.messageErreur(error));
        }
        await this.delay(500);
      }
    } finally {
      this.patchStatus({ syncInProgress: false, lastSync: new Date() });
      await this.refreshCounts();
    }
  }

  private envoyerAuBackend(payload: VenteArticlesOfflinePayload): Promise<number> {
    return new Promise((resolve, reject) => {
      this.barcodeService.createVente(payload.vente, payload.numerocommande).subscribe({
        next: (venteid) => resolve(venteid),
        error: (err) => reject(err)
      });
    });
  }

  /** Un rejet 4xx du backend (regle metier) n'est pas une panne reseau. */
  private estEchecMetier(error: any): boolean {
    return error?.status >= 400 && error?.status < 500 && error?.status !== 0;
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
