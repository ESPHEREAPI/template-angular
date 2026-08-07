import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuditLog } from '../model/audit-log';
import { AuditAccessGrant } from '../model/audit-access-grant';
import { CreateAuditAccessGrantRequest } from '../model/create-audit-access-grant-request';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api/audit`;

  constructor(private http: HttpClient) { }

  getLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.API_URL}/logs`);
  }

  getAccessGrants(): Observable<AuditAccessGrant[]> {
    return this.http.get<AuditAccessGrant[]>(`${this.API_URL}/access-grants`);
  }

  grantAccess(request: CreateAuditAccessGrantRequest): Observable<AuditAccessGrant> {
    return this.http.post<AuditAccessGrant>(`${this.API_URL}/access-grants`, request);
  }

  revokeAccess(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/access-grants/${id}/revoquer`, {});
  }
}
