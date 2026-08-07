import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../model/api-response';
import { BonAchat } from '../model/bon-achat';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BonAchatService {

   private apiUrl = '/api/bons-achat';

  constructor(private http: HttpClient) {}

  verifierCodeBon(code: string): Observable<ApiResponse<BonAchat>> {
    return this.http.get<ApiResponse<BonAchat>>(`${this.apiUrl}/verifier/${code}`);
  }

  creerBonAchat(bonAchat: BonAchat): Observable<ApiResponse<BonAchat>> {
    return this.http.post<ApiResponse<BonAchat>>(this.apiUrl, bonAchat);
  }

  utiliserBonAchat(code: string, montant: number): Observable<ApiResponse<BonAchat>> {
    return this.http.patch<ApiResponse<BonAchat>>(`${this.apiUrl}/${code}/utiliser`, { montant });
  }
}
