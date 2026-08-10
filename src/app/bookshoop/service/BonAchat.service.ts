import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BonAchat } from '../model/bon-achat';

@Injectable({
  providedIn: 'root'
})
export class BonAchatService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/bons-achat`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BonAchat[]> {
    return this.http.get<BonAchat[]>(this.apiUrl);
  }

  create(bonAchat: BonAchat): Observable<BonAchat> {
    return this.http.post<BonAchat>(this.apiUrl, bonAchat);
  }

  update(id: number, bonAchat: BonAchat): Observable<BonAchat> {
    return this.http.put<BonAchat>(`${this.apiUrl}/${id}`, bonAchat);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Emission rapide depuis la caisse : convertit un reliquat de monnaie
  // (rendu impossible faute de piece/billet) en bon d'achat. Le code et la
  // date d'expiration sont generes cote serveur.
  emettreDepuisRendu(nomClient: string, telephoneClient: string | undefined, montant: number): Observable<BonAchat> {
    return this.http.post<BonAchat>(`${this.apiUrl}/emettre-reliquat`, { nomClient, telephoneClient, montant });
  }
}
