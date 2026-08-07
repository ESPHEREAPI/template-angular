import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ModePaiement } from '../model/mode-paiement';

@Injectable({
  providedIn: 'root'
})
export class ModePaiementService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/modes-paiement`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ModePaiement[]> {
    return this.http.get<ModePaiement[]>(this.apiUrl);
  }
}
