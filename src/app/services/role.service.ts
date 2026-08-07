import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';
import { Role } from '../bookshoop/model/role';

/**
 * Le Role est une simple etiquette/categorie assignee a un utilisateur (plus
 * la hierarchie systeme SUPER_ADMIN/SYSTEM_ADMIN/COMPANY_ADMIN, geree a
 * part). Pour les droits d'acces (Menu x Action), voir ProfilService - c'est
 * le Profil qui les porte.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api`;

  constructor(private http: HttpClient) { }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/users/roles`);
  }

  // Pas d'endpoint dedie cote backend pour un role unique - derive de la
  // liste complete (deja peu volumineuse, chargee une seule fois).
  getRoleById(id: number): Observable<Role | undefined> {
    return this.getAllRoles().pipe(map(roles => roles.find(r => r.id === id)));
  }
}
