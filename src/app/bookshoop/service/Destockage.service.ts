import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DestockageService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) {}

  decrementerStock(articleId: number, boutiqueId: number, quantite: number): Observable<number> {
    return this.http.put<number>(
      `${this.apiUrl}/stock/${articleId}/${boutiqueId}/decrement`,
      { quantite }
    );
  }
}
