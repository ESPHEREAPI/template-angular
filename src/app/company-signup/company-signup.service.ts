import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateCompagnieRequest } from '../bookshoop/model/create-compagnie-request';

/**
 * Inscription autonome (public, sans authentification) : un futur
 * administrateur cree lui-meme sa compagnie - voir
 * CompagnieController.inscriptionAutonome cote backend. Service distinct
 * de bookshoop/service/compagnie.service.ts (reserve aux ecrans admin
 * authentifies) puisqu'aucun utilisateur n'est connecte a ce stade.
 */
@Injectable({ providedIn: 'root' })
export class CompanySignupService {
  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api/compagnies/self-service`;

  constructor(private http: HttpClient) {}

  inscrire(request: CreateCompagnieRequest): Observable<void> {
    return this.http.post<void>(this.API_URL, request);
  }

  verifierEmail(token: string): Observable<void> {
    return this.http.get<void>(`${this.API_URL}/verify`, { params: { token } });
  }

  renvoyerVerification(email: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/renvoyer`, { email });
  }
}
