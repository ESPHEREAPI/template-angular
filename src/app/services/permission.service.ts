import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Permissions } from '../model/permissions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/permissions`;
  constructor(private http: HttpClient) { }

  getPermissions(page: number = 1, limit: number = 10, search?: string, module?: string): Observable<{ data: Permissions[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    if (module) {
      params = params.set('module', module);
    }

    return this.http.get<{ data: Permissions[], total: number }>(this.apiUrl, { params });
  }

  getAllPermissions(): Observable<Permissions[]> {
    return this.http.get<Permissions[]>(`${this.apiUrl}/all`);
  }

  getPermissionById(id: number): Observable<Permissions> {
    return this.http.get<Permissions>(`${this.apiUrl}/${id}`);
  }

  createPermission(permission: Permissions): Observable<Permissions> {
    return this.http.post<Permissions>(this.apiUrl, permission);
  }

  updatePermission(id: number, permission: Permissions): Observable<Permissions> {
    return this.http.put<Permissions>(`${this.apiUrl}/${id}`, permission);
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getModules(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/modules`);
  }
}
