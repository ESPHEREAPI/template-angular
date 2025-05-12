import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';
import { Roles } from '../model/roles';
import { RolePermission } from '../model/role-permission';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) { }

  getRoles(page: number = 1, limit: number = 10, search?: string): Observable<{ data: Roles[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<{ data: Roles[], total: number }>(this.apiUrl, { params });
  }

  getAllRoles(): Observable<Roles[]> {
    return this.http.get<Roles[]>(`${this.apiUrl}/all`);
  }

  getRoleById(id: number): Observable<Roles> {
    return this.http.get<Roles>(`${this.apiUrl}/${id}`);
  }

  createRole(role: Roles): Observable<Roles> {
    return this.http.post<Roles>(this.apiUrl, role);
  }

  updateRole(id: number, role: Roles): Observable<Roles> {
    return this.http.put<Roles>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getRolePermissions(roleId: number): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.apiUrl}/${roleId}/permissions`);
  }

  assignPermissionsToRole(roleId: number, permissionIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${roleId}/permissions`, { permissionIds });
  }

  removePermissionFromRole(roleId: number, permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roleId}/permissions/${permissionId}`);
  }
  
}
