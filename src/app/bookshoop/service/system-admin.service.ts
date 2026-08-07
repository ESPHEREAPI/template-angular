import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../model/user';
import { AccountCreationResult } from '../model/account-creation-result';
import { CreateSystemAdminRequest } from '../model/create-system-admin-request';
import { ResetPasswordResult } from '../model/reset-password-result';

@Injectable({
  providedIn: 'root'
})
export class SystemAdminService {

  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api/admin/system-admins`;

  constructor(private http: HttpClient) { }

  create(request: CreateSystemAdminRequest): Observable<AccountCreationResult> {
    return this.http.post<AccountCreationResult>(this.API_URL, request);
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  }

  resetPassword(id: number): Observable<ResetPasswordResult> {
    return this.http.post<ResetPasswordResult>(`${this.API_URL}/${id}/reset-password`, {});
  }

  activer(id: number, motif: string): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/${id}/activer`, { motif });
  }

  desactiver(id: number, motif: string): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/${id}/desactiver`, { motif });
  }
}
