import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, fromEvent, merge, of, timer } from 'rxjs';
import { catchError, filter, switchMap, timeout } from 'rxjs/operators';

/**
 * Detection de connexion partagee par tous les ecrans "hors-ligne toleres"
 * (voir OfflineSyncService.ts pour la premiere implementation, specifique a
 * la Vente, dont ce service extrait la partie reutilisable).
 *
 * navigator.onLine seul ne suffit pas : il indique que l'appareil a un
 * reseau, pas que NOTRE backend repond (proxy d'entreprise, backend en
 * maintenance, DNS local...). backendAvailable$ verifie donc reellement
 * via un GET fourni par l'appelant (pas d'endpoint dedie a ajouter - chaque
 * ecran reutilise un GET dont il a de toute facon besoin).
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly backendCheckInterval = 30000;
  private readonly requestTimeout = 15000;

  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private backendAvailableSubject = new BehaviorSubject<boolean>(false);

  // Le ping backend a besoin d'une URL a interroger - fournie par le
  // premier ecran qui en a besoin. Plusieurs ecrans peuvent se relayer
  // (le dernier appel a setPingUrl() gagne, un seul timer partage).
  private pingUrl: string | null = null;

  readonly isOnline$: Observable<boolean> = this.isOnlineSubject.asObservable();
  readonly backendAvailable$: Observable<boolean> = this.backendAvailableSubject.asObservable();

  constructor(private http: HttpClient) {
    this.monitorBrowserConnectivity();
    this.startBackendHealthCheck();
  }

  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  get isBackendAvailable(): boolean {
    return this.backendAvailableSubject.value;
  }

  /** A appeler une fois par l'ecran qui a besoin du ping backend (ngOnInit). */
  setPingUrl(url: string): void {
    this.pingUrl = url;
  }

  async checkBackendNow(pingUrl?: string): Promise<boolean> {
    const url = pingUrl || this.pingUrl;
    if (!url) {
      return false;
    }

    const reachable = await this.http.get(url, { observe: 'response' })
      .pipe(
        timeout(this.requestTimeout),
        catchError((error: HttpErrorResponse) => {
          console.warn('⚠️ ConnectivityService: backend injoignable', error.status, error.message);
          return of(null);
        })
      )
      .toPromise()
      .then(response => response !== null && response !== undefined && response.status === 200)
      .catch(() => false);

    this.backendAvailableSubject.next(reachable);
    return reachable;
  }

  private monitorBrowserConnectivity(): void {
    const online$ = fromEvent(window, 'online');
    const offline$ = fromEvent(window, 'offline');

    merge(online$, offline$).subscribe(() => {
      const online = navigator.onLine;
      this.isOnlineSubject.next(online);

      if (online && this.pingUrl) {
        this.checkBackendNow();
      } else if (!online) {
        this.backendAvailableSubject.next(false);
      }
    });
  }

  private startBackendHealthCheck(): void {
    timer(0, this.backendCheckInterval)
      .pipe(
        filter(() => navigator.onLine && !!this.pingUrl),
        switchMap(() => this.checkBackendNow())
      )
      .subscribe();
  }
}
