import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BarcodeproduitResponse } from '../model/BarcodeproduitResponse';
import { Barcodeproduit } from '../model/barcodeproduit';

export interface BarcodeCreateRequest {
  codeBard: string;
  produitId: number;
  boutiqueId: number;
}

@Injectable({
  providedIn: 'root'
})
export class BarcodeGestionService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/barcodes`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 0, size: number = 10): Observable<BarcodeproduitResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<BarcodeproduitResponse>(`${this.apiUrl}/page`, { params });
  }

  create(request: BarcodeCreateRequest): Observable<Barcodeproduit> {
    return this.http.post<Barcodeproduit>(this.apiUrl, request);
  }

  update(id: number, codeBard: string): Observable<Barcodeproduit> {
    return this.http.put<Barcodeproduit>(`${this.apiUrl}/${id}`, { codeBard });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
