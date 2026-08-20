import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor{
    private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Le site public e-commerce (/e-com/compagnie/**) a son propre token
    // (client, pas staff) et son propre intercepteur - voir
    // StorefrontTokenInterceptor. Ne jamais y attacher le token staff, ni
    // rediriger vers /login sur un 401 la-bas (ce serait la mauvaise page
    // de connexion pour un visiteur).
    if (request.url.includes('/e-com/compagnie/')) {
      return next.handle(request);
    }

    // Ajouter le token d'authentification si l'utilisateur est connecté
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.token) {
      request = this.addToken(request, currentUser.token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !request.url.includes('/auth/login')) {
          // Gérer les erreurs 401 (non autorisé)
          return this.handle401Error(request, next);
        }
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.toastr.error("Vous n'avez pas les droits nécessaires pour cette action.", 'Accès refusé');
        }
        if (error instanceof HttpErrorResponse && error.status === 402) {
          this.toastr.error('Licence expirée ou invalide, contactez votre administrateur.', 'Licence');
        }
        return throwError(error);
      })
    );
  }

  
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(userSession => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(userSession.token);
          return next.handle(this.addToken(request, userSession.token));
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.authService.logout();
          this.toastr.warning('Votre session a expiré, veuillez vous reconnecter.', 'Session expirée');
          this.router.navigate(['/login']);
          return throwError(error);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}
