import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Photocopie, PhotocopiePage, PhotocopieSummary } from '../model/photocopie';

@Injectable({
  providedIn: 'root'
})
export class PhotocopieService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/photocopie`;

  constructor(private http: HttpClient) {}

  findByMois(anneeid: number, boutiqueid: number, userName: string, page: number = 0, size: number = 15): Observable<PhotocopiePage> {
    const params = new HttpParams()
      .set('anneeid', anneeid.toString())
      .set('boutiqueid', boutiqueid.toString())
      .set('userName', userName)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PhotocopiePage>(this.apiUrl, { params });
  }

  getSummary(anneeid: number, boutiqueid: number, userName: string): Observable<PhotocopieSummary> {
    const params = new HttpParams()
      .set('anneeid', anneeid.toString())
      .set('boutiqueid', boutiqueid.toString())
      .set('userName', userName);
    return this.http.get<PhotocopieSummary>(`${this.apiUrl}/summary`, { params });
  }

  create(photocopie: Photocopie): Observable<Photocopie> {
    return this.http.post<Photocopie>(this.apiUrl, photocopie);
  }

  update(id: number, photocopie: Photocopie): Observable<Photocopie> {
    return this.http.put<Photocopie>(`${this.apiUrl}/${id}`, photocopie);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
