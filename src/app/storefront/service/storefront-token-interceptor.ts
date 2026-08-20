import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorefrontAuthService } from './storefront-auth.service';

/**
 * Attache le JWT client (typ=customer) UNIQUEMENT aux appels du site public
 * e-commerce (/e-com/compagnie/**) - jamais aux routes internes, et jamais
 * en meme temps que le token staff (voir TokenInterceptor.isStorefrontUrl,
 * qui s'exclut mutuellement avec celui-ci sur ces memes URLs). Une commande
 * invite (pas de session client) part simplement sans Authorization, geree
 * cote backend par les champs guestXxx du corps de la requete.
 */
@Injectable()
export class StorefrontTokenInterceptor implements HttpInterceptor {
  constructor(private storefrontAuth: StorefrontAuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!request.url.includes('/e-com/compagnie/')) {
      return next.handle(request);
    }
    const session = this.storefrontAuth.currentSession;
    if (session?.token) {
      request = request.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } });
    }
    return next.handle(request);
  }
}
