import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionStock } from '../model/transaction-stock';
import { Produit } from '../model/produit';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TransactionService {
 // private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

   constructor(private http: HttpClient) { }

 /**   transferer(data: {
    produitId: number;
    sourceId: number;
    destinationId: number;
    quantite: number;
  }): Observable<void> {
    return this.http.post<void>(this.apiUrl, data);
  }

  getHistorique(): Observable<TransactionStock[]> {
    return this.http.get<TransactionStock[]>(this.apiUrl);
  }*/

   getProduitsAutoComplet(): Observable<Produit[]> {
      return this.http.get<Produit[]>(`http://localhost:8080/gateway-proxy/api/microservice-produits/top`);
    }
}
