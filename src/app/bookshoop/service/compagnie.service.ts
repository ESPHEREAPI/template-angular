import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Compagnie } from '../model/compagnie';
import { CreateCompagnieRequest } from '../model/create-compagnie-request';
import { CreateCompagnieResult } from '../model/create-compagnie-result';
import { ResetPasswordResult } from '../model/reset-password-result';

@Injectable({
  providedIn: 'root'
})
export class CompagnieService {

  private readonly API_URL = `${environment.apiUrl}/gateway-proxy/api/compagnies`;

  constructor(private http: HttpClient) { }

  create(request: CreateCompagnieRequest): Observable<CreateCompagnieResult> {
    return this.http.post<CreateCompagnieResult>(this.API_URL, request);
  }

  getAll(): Observable<Compagnie[]> {
    return this.http.get<Compagnie[]>(this.API_URL);
  }

  getById(id: number): Observable<Compagnie> {
    return this.http.get<Compagnie>(`${this.API_URL}/${id}`);
  }

  getOwn(): Observable<Compagnie> {
    return this.http.get<Compagnie>(`${this.API_URL}/me`);
  }

  update(id: number, compagnie: Partial<Compagnie>): Observable<Compagnie> {
    return this.http.put<Compagnie>(`${this.API_URL}/${id}`, compagnie);
  }

  updateOwn(compagnie: Partial<Compagnie>): Observable<Compagnie> {
    return this.http.put<Compagnie>(`${this.API_URL}/me`, compagnie);
  }

  resetAdminPassword(id: number): Observable<ResetPasswordResult> {
    return this.http.post<ResetPasswordResult>(`${this.API_URL}/${id}/reset-admin-password`, {});
  }

  resynchroniserModulesAdmin(id: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/resynchroniser-modules`, {});
  }

  activer(id: number, motif: string): Observable<Compagnie> {
    return this.http.post<Compagnie>(`${this.API_URL}/${id}/activer`, { motif });
  }

  desactiver(id: number, motif: string): Observable<Compagnie> {
    return this.http.post<Compagnie>(`${this.API_URL}/${id}/desactiver`, { motif });
  }
}
