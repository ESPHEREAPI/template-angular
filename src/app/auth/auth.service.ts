import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserSession } from '../model/user-session';
import { User } from '../model/user';
import { LoginRequest } from '../model/login-request';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api`;
  private currentUserSubject: BehaviorSubject<UserSession | null>;
  public currentUser$: Observable<UserSession | null>;
  private  loginInfos: LoginRequest | undefined;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<UserSession | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  login(userName: string, passWord: string): Observable<UserSession> {
    this.loginInfos= {
     
      userName: userName,
      passWord: passWord
    };
     
   

    return this.http.post<UserSession>(`${this.apiUrl}/auth/login`, this.loginInfos)
      .pipe(
        tap(userSession => {
          this.saveUserToStorage(userSession);
          this.currentUserSubject.next(userSession);
        })
      );
  }
  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      }),
      catchError(error => {
        // En cas d'erreur, on déconnecte quand même l'utilisateur localement
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  register(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/gateway-proxy/api/auth/register`, user);
  }

  refreshToken(): Observable<UserSession> {
    return this.http.post<UserSession>(`${this.apiUrl}/refresh-token`, {}).pipe(
      tap(userSession => {
        this.saveUserToStorage(userSession);
        this.currentUserSubject.next(userSession);
      })
    );
  }

  isLoggedIn(): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return false;
    }
    // Vérifier si le token est expiré
    return new Date(currentUser.expiresAt) > new Date();
  }

  hasPermission(permissionCode: string): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.permissions) {
      return false;
     // return true
    }
    return currentUser.permissions.includes(permissionCode);
  }

  hasAnyPermission(permissionCodes: string[]): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    return permissionCodes.some(code => currentUser.permissions.includes(code));
  }

  hasAllPermissions(permissionCodes: string[]): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    return permissionCodes.every(code => currentUser.permissions.includes(code));
  }

  private saveUserToStorage(userSession: UserSession): void {

    localStorage.setItem('currentUser', JSON.stringify(userSession));
  }

  private getUserFromStorage(): UserSession | null {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      // Convertir les dates stockées en chaînes en objets Date
      if (user.expiresAt) {
        user.expiresAt = new Date(user.expiresAt);
      }
      return user;
    }
    return null;
  }

  
}
