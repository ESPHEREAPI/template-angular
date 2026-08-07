import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from '../model/product';
import { Observable } from 'rxjs';
import { StoreLocation } from '../model/store-location';
import { StockTransfer } from '../model/stock-transfer';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

 private apiUrl = 'api/products';
  private locationsUrl = 'api/locations';
  private transfersUrl = 'api/transfers';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${product.id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Méthodes de gestion des emplacements
  getLocations(): Observable<StoreLocation[]> {
    return this.http.get<StoreLocation[]>(this.locationsUrl);
  }

  // Méthodes de transfert de stock
  transferStock(transfer: StockTransfer): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(this.transfersUrl, transfer);
  }

  getTransfers(): Observable<StockTransfer[]> {
    return this.http.get<StockTransfer[]>(this.transfersUrl);
  }
}
