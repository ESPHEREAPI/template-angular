// auth.service.ts - Version avec debug amélioré

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { UserSession } from '../model/user-session';
import { LoginRequest } from '../model/login-request';
import { User } from '../bookshoop/model/user';
import { Boutique } from '../bookshoop/model/boutique';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  [x: string]: any;
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api`;
  private currentUserSubject: BehaviorSubject<UserSession | null>;
  public currentUser$: Observable<UserSession | null>;
  private loginInfos: LoginRequest | undefined;
  public token!: any;
  userAuthenticated!: any;
   userSession: any;
  // Codes de profil nécessitant la sélection de boutique
  private readonly PROFILES_REQUIRING_BOUTIQUE = ['ADMIN', 'MANAGER'];

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<UserSession | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
    const userFromStorage = this.getUserFromStorage();
    console.log('[AuthService] Initial user from localStorage:', userFromStorage);
    console.log('[AuthService] usersDTO:', userFromStorage?.usersDTO);

    this.currentUserSubject = new BehaviorSubject<UserSession | null>(userFromStorage);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  public get currentUserDTO(): User | undefined {
    return this.currentUserSubject.value?.usersDTO;
  }

  public setCurrentUser(session: UserSession | null) {
    this.saveUserToStorage(session!);
    this.currentUserSubject.next(session);
  }

  login(userName: string, passWord: string): Observable<UserSession> {
    this.loginInfos = {
      userName: "" + userName,
      passWord: "" + passWord
    };

    //console.log('Données envoyées:', this.loginInfos);

    return this.http.post<UserSession>(`${this.apiUrl}/auth/login`, this.loginInfos, {
      observe: 'response',
      responseType: 'text' as 'json'
    })
      .pipe(
        map((response: any) => {
          console.log('Réponse brute du serveur:', response.body);

          try {
            const parsedResponse = JSON.parse(response.body);
            console.log('JSON parsé avec succès:', parsedResponse);
            return parsedResponse;
          } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            console.error('Réponse qui pose problème:', response.body);
            throw parseError;
          }
        }),
        tap(userSession => {
          if (this.requiresBoutiqueSelection(userSession) === false) {
            
            this.saveUserToStorage(userSession);
          }

          this.currentUserSubject.next(userSession);
          console.log('[AuthService] New user session:', userSession);
          console.log('[AuthService] usersDTO in next():', userSession?.usersDTO);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur complète:', error);
          // Identifiants invalides (401) : le corps est du texte brut (responseType 'text'),
          // on le parse ici pour exposer messageEcheck au composant de login.
          if (error.error && typeof error.error === 'string') {
            console.error('Réponse d\'erreur brute:', error.error);
            try {
              const parsedBody = JSON.parse(error.error);
              return throwError(() => Object.assign(error, { parsedBody }));
            } catch {
              // Corps non-JSON (ex: erreur reseau/gateway) - laisse tomber tel quel.
            }
          }
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken_esacompro');
    this.currentUserSubject.next(null);
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken_esacompro');
        this.currentUserSubject.next(null);
      }),
    );
  }

  register(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, user);
  }

  changePassword(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/change-password`, { ancienMotDePasse, nouveauMotDePasse });
  }

  refreshToken(): Observable<UserSession> {
    return this.http.post<UserSession>(`${this.apiUrl}/refresh-token`, {}).pipe(
      tap(userSession => {
        this.saveUserToStorage(userSession);
        this.currentUserSubject.next(userSession);
      })
    );
  }

  // ✅ CORRECTION PRINCIPALE - Méthode isLoggedIn() améliorée
  isLoggedIn(): boolean {
    try {
      const currentUser = this.currentUserValue;
      console.log('[AuthService] Checking authentication for user:', currentUser);

      if (!currentUser) {
        console.log('[AuthService] No current user found');
        return false;
      }

      // Vérifier si le token est expiré
      const isValid = new Date(currentUser.expiresAt) > new Date();
      console.log('[AuthService] Token validity:', isValid, 'Expires at:', currentUser.expiresAt);

      // Si le token est expiré, nettoyer le storage
      if (!isValid) {
        console.log('[AuthService] Token expired, clearing storage');
        this.clearAuthData();
        return false;
      }

      // Pour ADMIN et MANAGER, vérifier que la boutique est assignée
      if (this.requiresBoutiqueSelection(currentUser)) {
        const hasBoutique = currentUser.usersDTO?.boutiqueid != null;
        console.log('[AuthService] Boutique required - Has boutique:', hasBoutique);
        return isValid && hasBoutique;
      }


      return isValid;
    } catch (error) {
      console.error('[AuthService] Error checking authentication:', error);
      this.clearAuthData();
      return false;
    }
  }

  // ✅ Méthode pour nettoyer les données d'authentification
  private clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken_esacompro');
    this.currentUserSubject.next(null);
  }

  hasPermission(permissionCode: string): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.permissions) {
      console.log('[AuthService] No permissions found for user');
      return false;
    }
    const hasPermission = currentUser.permissions.includes(permissionCode);
    console.log(`[AuthService] Permission '${permissionCode}': ${hasPermission}`);
    return hasPermission;
  }

  hasAnyPermission(permissionCodes: string[]): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.permissions) {
      console.log('[AuthService] No permissions found for hasAnyPermission check');
      return false;
    }
    const hasAny = permissionCodes.some(code => currentUser.permissions.includes(code));
    console.log(`[AuthService] HasAnyPermission for [${permissionCodes.join(', ')}]: ${hasAny}`);
    return hasAny;
  }

  hasAllPermissions(permissionCodes: string[]): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.permissions) {
      console.log('[AuthService] No permissions found for hasAllPermissions check');
      return false;
    }
    const hasAll = permissionCodes.every(code => currentUser.permissions.includes(code));
    console.log(`[AuthService] HasAllPermissions for [${permissionCodes.join(', ')}]: ${hasAll}`);
    return hasAll;
  }

  private saveUserToStorage(userSession: UserSession): void {
    try {
      this.token = {
        username: this.loginInfos?.userName,
        roles: userSession.usersDTO.profil?.code
      };
      localStorage.setItem('authToken_esacompro', btoa(JSON.stringify(this.token)));
      localStorage.setItem('currentUser', JSON.stringify(userSession));
      console.log('[AuthService] User data saved to localStorage');
    } catch (error) {
      console.error('[AuthService] Error saving user to storage:', error);
    }
  }

  getUserFromStorage(): UserSession | null {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        // Convertir les dates stockées en chaînes en objets Date
        if (user.expiresAt) {
          user.expiresAt = new Date(user.expiresAt);
        }
        console.log('[AuthService] User loaded from localStorage:', user);
        return user;
      }
      console.log('[AuthService] No user data in localStorage');
      return null;
    } catch (error) {
      console.error('[AuthService] Error loading user from storage:', error);
      // En cas d'erreur, nettoyer le storage corrompu
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken_esacompro');
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur doit sélectionner une boutique
   * Retourne true pour les profils ADMIN et MANAGER
   */
  public requiresBoutiqueSelection(userSession: UserSession): boolean {
    // COMPANY_ADMIN n'a pas de Profil (champ reserve aux comptes EMPLOYE) et
    // n'a jamais de boutiqueid fixe assigne a la creation du compte - il
    // choisit son point de vente a chaque connexion.
    const roleName = userSession?.usersDTO?.role?.name?.toUpperCase();
    if (roleName === 'COMPANY_ADMIN') {
      console.log('[AuthService] Role COMPANY_ADMIN - Requires boutique selection: true');
      return true;
    }

    const profilCode = userSession?.usersDTO?.profil?.code?.toUpperCase();
    const requires = profilCode && this.PROFILES_REQUIRING_BOUTIQUE.includes(profilCode);
    console.log('[AuthService] Profil:', profilCode, '- Requires boutique selection:', requires);
    return requires || false;
  }

  /**
   * Affecte une boutique à l'utilisateur courant
   */
  public assignBoutique(boutiqueId: number): void {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      console.error('[AuthService] Cannot assign boutique: no current user');
      return;
    }
    if (boutiqueId === 0) {
      console.error('[AuthService] Cannot assign boutique: no select boutique');
      return;
    }

    // Affecter l'ID de la boutique au champ boutiqueId de usersDTO
    if (currentUser.usersDTO) {
      currentUser.usersDTO.boutiqueid = boutiqueId;
      console.log('[AuthService] Boutique assigned:', boutiqueId);

      // Sauvegarder et mettre à jour
      this.saveUserToStorage(currentUser);
      this.currentUserSubject.next(currentUser);

      console.log('[AuthService] Updated user with boutique:', currentUser.usersDTO);
    }
  }
  getBoutiques(): Observable<Boutique[]> {

    return this.http.get<Boutique[]>(`${this.apiUrl}/microservice-produits/all`);
  }
  getBoutiqueByUserSession():number{
    this.userSession=this.currentUserValue;
     if (this.userSession && this.userSession.usersDTO) {

      return this.userSession.usersDTO.boutiqueid;
     }
     return 0;
  }
  getAnneeByUserSession():number{
     this.userSession=this.currentUserValue;
     if (this.userSession && this.userSession.usersDTO) {

      return this.userSession.anneeid;
     }
     return 0;
  }
}