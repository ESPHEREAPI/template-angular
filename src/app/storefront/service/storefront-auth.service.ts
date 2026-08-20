import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorefrontSession } from '../model/storefront-auth';

// Cle localStorage DEDIEE, distincte de "currentUser"/"authToken_esacompro"
// (session staff, voir AuthService) - un membre du personnel qui visite sa
// propre boutique en ligne dans le meme navigateur ne doit jamais melanger
// les deux sessions. Voir aussi storefront-token-interceptor.ts.
const STORAGE_KEY = 'storefrontSession';

/**
 * Session client e-commerce (compte optionnel - voir EcomAuthController).
 * Volontairement independant de AuthService : logique staff (boutique
 * assignee, permissions, roles) sans rapport avec un client final.
 */
@Injectable({ providedIn: 'root' })
export class StorefrontAuthService {
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com/compagnie`;
  private sessionSubject = new BehaviorSubject<StorefrontSession | null>(this.readFromStorage());
  public session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentSession(): StorefrontSession | null {
    return this.sessionSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.sessionSubject.value !== null;
  }

  register(code: string, email: string, password: string, nom: string, telephone: string): Observable<StorefrontSession> {
    return this.http
      .post<StorefrontSession>(`${this.apiUrl}/${code}/register`, { email, password, nom, telephone })
      .pipe(tap((session) => this.setSession(session)));
  }

  login(code: string, email: string, password: string): Observable<StorefrontSession> {
    return this.http
      .post<StorefrontSession>(`${this.apiUrl}/${code}/login`, { email, password })
      .pipe(tap((session) => this.setSession(session)));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  private setSession(session: StorefrontSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readFromStorage(): StorefrontSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StorefrontSession;
    } catch {
      return null;
    }
  }
}
