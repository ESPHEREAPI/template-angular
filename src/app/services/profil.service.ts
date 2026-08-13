import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { Profil } from '../bookshoop/model/profil';
import { MenuActions } from '../bookshoop/model/menu-actions';
import { ActionDTO } from '../bookshoop/model/action';
import { PersonneMenuActions } from '../bookshoop/model/personne-menu-actions';

export interface TogglePermissionRequest {
  profilId: number;
  menuId: number;
  action: string;
  granted: boolean;
}

export interface PersonnePermissionExceptionRequest {
  menuId: number;
  action: string;
  type: 'GRANT' | 'REVOKE';
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

  dupliquerProfil(profilId: number, code: string, description: string): Observable<Profil> {
    return this.http.post<Profil>(`${this.API_URL}/profils/${profilId}/dupliquer`, { code, description });
  }

  // Catalogue global des actions (voir ActionController) - gere par
  // SUPER_ADMIN/SYSTEM_ADMIN, consomme par toutes les compagnies.
  getActions(): Observable<ActionDTO[]> {
    return this.http.get<ActionDTO[]>(`${this.API_URL}/actions`);
  }

  createAction(code: string, libelle: string, description: string): Observable<ActionDTO> {
    return this.http.post<ActionDTO>(`${this.API_URL}/actions`, { code, libelle, description });
  }

  // Droits effectifs d'un utilisateur precis (Profil + exceptions, voir
  // PersonnePermissionController) - alimente l'onglet "Droits effectifs"
  // de l'ecran Utilisateurs.
  getPermissionsEffectives(personneId: number): Observable<PersonneMenuActions[]> {
    return this.http.get<PersonneMenuActions[]>(`${this.API_URL}/personne/${personneId}/permissions-effectives`);
  }

  definirException(personneId: number, request: PersonnePermissionExceptionRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/personne/${personneId}/permission-exception`, request);
  }
}
