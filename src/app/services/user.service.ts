import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../bookshoop/model/user';

export interface CreateUserRequest {
  /** Optionnel : si absent, genere automatiquement selon le format configure dans "Option Entreprise". */
  userName?: string;
  firstName: string;
  lastname: string;
  password: string;
  email?: string;
  tel?: string;
  profilid?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/users`;

   constructor(private http: HttpClient) { }

   getUsers(page: number = 1, limit: number = 10, search?: string): Observable<{ data: User[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<{ data: User[], total: number }>(this.apiUrl+ "/all-users", { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }

  updateUser(id: number, user: Partial<CreateUserRequest>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/update-user`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // TODO: aucun endpoint dedie cote backend pour l'instant (hors perimetre
  // de ce chantier) - conserve pour ne pas casser user-list.component.ts.
  activateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
