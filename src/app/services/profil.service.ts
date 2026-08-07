import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { Profil } from '../bookshoop/model/profil';
import { MenuActions } from '../bookshoop/model/menu-actions';

export interface TogglePermissionRequest {
  profilId: number;
  menuId: number;
  action: string;
  granted: boolean;
}

/**
 * Le Profil porte la matrice de droits (Menu x Action) - c'est lui qui est
 * assigne aux utilisateurs (Personne.profilid) et determine ce qu'ils
 * peuvent voir/faire. Le Role reste une simple etiquette (voir RoleService).
 */
@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api`;

  constructor(private http: HttpClient) { }

  getAllProfils(): Observable<Profil[]> {
    return this.http.get<Profil[]>(`${this.API_URL}/users/profils`);
  }

  // Catalogue de reference Module -> Menu -> Actions disponibles (ecran
  // "Module Securite"), independant de tout profil.
  getCatalogue(): Observable<MenuActions[]> {
    return this.http.get<MenuActions[]>(`${this.API_URL}/modules-securite/catalogue`);
  }

  createProfil(code: string, description: string): Observable<Profil> {
    return this.http.post<Profil>(`${this.API_URL}/users/profils`, { code, description });
  }

  getMatrice(profilId: number): Observable<MenuActions[]> {
    return this.http.get<MenuActions[]>(`${this.API_URL}/profils/${profilId}/permissions-matrix`);
  }

  togglePermission(request: TogglePermissionRequest): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/profils/permissions-matrix/toggle`, request);
  }
}
