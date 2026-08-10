import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categorie } from '../model/categorie';
import { Depot } from '../model/depot';
import { environment } from '../../../environments/environment';
import { Boutique } from '../model/boutique';
import { Annee } from '../model/annee';

@Injectable({
  providedIn: 'root'
})
export class ReferenceDataService {

private readonly API_URL =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.API_URL}/categories`);
  }

  getDepots(boutiqueid:number): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.API_URL}/depots/${boutiqueid}`);
  }
    getBoutiques(): Observable<Boutique[]> {
    return this.http.get<Boutique[]>(`${this.API_URL}/boutique`);
  }

  getAnnees(): Observable<Annee[]> {
    return this.http.get<Annee[]>(`${this.API_URL}/all-annee`);
  }

   getDepotsMagasin(): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.API_URL}/depots-stockage`);
  }

  // Depots ET points de vente - pour le Transfert de Stock, ou les deux
  // natures de magasin sont des sources/destinations valides.
  getTousLesMagasins(): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.API_URL}/magasins-transfert`);
  }
}

