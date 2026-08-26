/**
 * File d'attente locale generique (IndexedDB) pour les operations qui
 * doivent survivre a une coupure reseau - meme cycle de vie que celui deja
 * eprouve dans OfflineSyncService.ts (specifique a la Vente), generalise
 * sur un type de payload libre T.
 *
 * Pas un @Injectable Angular : instancie directement par chaque service
 * metier avec sa propre config (nom de base, de magasin) - une file par
 * domaine (vente, code-barres...), jamais partagee entre domaines.
 */
export interface QueueRecord<T> {
  localId: string;
  createdAt: Date;
  synced: boolean;
  tentativeSync: number;
  permanentFailure: boolean;
  errorMessage?: string;
  lastSyncAttempt?: Date;
  payload: T;
}

export interface IndexedDbQueueConfig {
  dbName: string;
  storeName: string;
  version?: number;
}

export class IndexedDbQueueService<T> {
  private readonly maxRetries = 3;
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<void> | null = null;

  constructor(private config: IndexedDbQueueConfig) {}

  async add(payload: T): Promise<string> {
    await this.ensureDb();
    const record: QueueRecord<T> = {
      localId: this.generateLocalId(),
      createdAt: new Date(),
      synced: false,
      tentativeSync: 0,
      permanentFailure: false,
      payload
    };

    return new Promise((resolve, reject) => {
      const store = this.store('readwrite');
      const request = store.add(record);
      request.onsuccess = () => resolve(record.localId);
      request.onerror = () => reject(request.error);
    });
  }

  /** Corrige le payload d'une entree PAS ENCORE synchronisee (evite d'empiler une 2e operation contradictoire). */
  async update(localId: string, payload: T): Promise<void> {
    return this.mutate(localId, record => {
      record.payload = payload;
    });
  }

  async remove(localId: string): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const request = this.store('readwrite').delete(localId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<QueueRecord<T>[]> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const request = this.store('readonly').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPending(): Promise<QueueRecord<T>[]> {
    const all = await this.getAll();
    return all.filter(r => !r.synced);
  }

  /** Entrees ayant atteint maxRetries - ne sont plus retentees automatiquement. */
  async getFailed(): Promise<QueueRecord<T>[]> {
    const pending = await this.getPending();
    return pending.filter(r => r.permanentFailure);
  }

  async markSynced(localId: string): Promise<void> {
    return this.mutate(localId, record => {
      record.synced = true;
    });
  }

  /** Retourne true si l'entree bascule en echec definitif (maxRetries atteint). */
  async incrementAttempt(localId: string, errorMessage: string): Promise<boolean> {
    let permanentFailure = false;
    await this.mutate(localId, record => {
      record.tentativeSync = (record.tentativeSync || 0) + 1;
      record.errorMessage = errorMessage;
      record.lastSyncAttempt = new Date();
      if (record.tentativeSync >= this.maxRetries) {
        record.permanentFailure = true;
      }
      permanentFailure = !!record.permanentFailure;
    });
    return permanentFailure;
  }

  /** Relance manuellement une entree en echec definitif. */
  async retryFailed(localId: string): Promise<void> {
    return this.mutate(localId, record => {
      record.permanentFailure = false;
      record.tentativeSync = 0;
      record.errorMessage = undefined;
    });
  }

  private async mutate(localId: string, apply: (record: QueueRecord<T>) => void): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const store = this.store('readwrite');
      const getRequest = store.get(localId);
      getRequest.onsuccess = () => {
        const record = getRequest.result as QueueRecord<T> | undefined;
        if (!record) {
          resolve();
          return;
        }
        apply(record);
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private store(mode: IDBTransactionMode): IDBObjectStore {
    return this.db!.transaction([this.config.storeName], mode).objectStore(this.config.storeName);
  }

  private ensureDb(): Promise<void> {
    if (this.db) {
      return Promise.resolve();
    }
    if (!this.dbInitPromise) {
      this.dbInitPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.config.dbName, this.config.version || 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            const store = db.createObjectStore(this.config.storeName, { keyPath: 'localId' });
            store.createIndex('synced', 'synced', { unique: false });
          }
        };
      });
    }
    return this.dbInitPromise;
  }

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
