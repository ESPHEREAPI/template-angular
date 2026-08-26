import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
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
        // Seule une absence totale de reponse (status 0 - coupure reseau,
        // CORS, timeout) justifie de mettre en file et de dire "enregistre"
        // au caissier. TOUT rejet avec une reponse HTTP effective (le
        // backend a repondu, meme via un code 500 generique - ex. bon
        // d'achat invalide, stock insuffisant) doit remonter immediatement
        // a l'appelant : le confondre avec une coupure reseau permettrait
        // de faire "passer" une vente en payant avec un faux bon d'achat,
        // le rejet du serveur restant invisible pour le caissier.
        if (!this.estErreurReseau(error)) {
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
      this.barcodeService.createVente(payload.vente, payload.numerocommande)
        .pipe(timeout(20000))
        .subscribe({
          next: (venteid) => resolve(venteid),
          // Un TimeoutError (pas de reponse dans les 20s) n'a pas de
          // "status" HTTP - estErreurReseau() le traite comme une panne
          // reseau, correctement (le serveur n'a jamais confirme avoir vu
          // la requete, contrairement a un rejet explicite type 400/500).
          error: (err) => reject(err)
        });
    });
  }

  /**
   * status===0 (ou absent) = aucune reponse HTTP recue du tout (coupure,
   * CORS, timeout) - la seule situation ou l'on peut affirmer que le
   * backend n'a pas pu voir la requete. Tout code de statut recu, y
   * compris 500, signifie que le backend a bien traite la requete et l'a
   * rejetee - jamais a confondre avec une panne reseau (voir enregistrer()).
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
