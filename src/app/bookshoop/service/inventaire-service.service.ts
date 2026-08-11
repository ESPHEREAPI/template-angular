// services/inventaire.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventaireFilter } from '../model/inventaire-filter';
import { Inventaire } from '../model/inventaire';
import { Boutique } from '../model/boutique';
import { Categorie } from '../model/categorie';
import { Depot } from '../model/depot';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class InventaireService {
  private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) { }

  // Récupérer tous les inventaires
  getInventaires(filter?: InventaireFilter): Observable<Inventaire[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.reference) params = params.set('reference', filter.reference);
      if (filter.libelle) params = params.set('libelle', filter.libelle);
      if (filter.boutique) params = params.set('boutique', filter.boutique.toString());
      if (filter.categorie) params = params.set('categorie', filter.categorie.toString());
      if (filter.depot) params = params.set('depot', filter.depot.toString());
      if (filter.dateInventaire) params = params.set('dateInventaire', filter.dateInventaire.toISOString());
    }
    
    return this.http.get<Inventaire[]>(`${this.apiUrl}/inventaires`, { params });
  }

  // Récupérer un inventaire par ID
  getInventaireById(id: number): Observable<Inventaire> {
    return this.http.get<Inventaire>(`${this.apiUrl}/inventaires/${id}`);
  }

  // Créer un nouvel inventaire
  createInventaire(inventaire: Inventaire): Observable<Inventaire> {
    return this.http.post<Inventaire>(`${this.apiUrl}/inventaires`, inventaire);
  }

  // Mettre à jour un inventaire
  updateInventaire(id: number, inventaire: Inventaire): Observable<Inventaire> {
    return this.http.put<Inventaire>(`${this.apiUrl}/inventaires/${id}`, inventaire);
  }

  // Supprimer un inventaire
  deleteInventaire(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/inventaires/${id}`);
  }

  // Charger l'inventaire par boutique et catégorie
  chargerInventaire(boutiqueid: number, categorieid: number): Observable<Inventaire[]> {
    return this.http.get<Inventaire[]>(`${this.apiUrl}/inventaires/boutique/${boutiqueid}/categorie/${categorieid}`);
  }

  // Charger l'inventaire par dépôt
  chargerInventaireParDepot(depotId: number): Observable<Inventaire[]> {
    return this.http.get<Inventaire[]>(`${this.apiUrl}/inventaires/depot/${depotId}`);
  }

  // Charger l'inventaire par date
  chargerInventaireParDate(date: Date): Observable<Inventaire[]> {
    return this.http.get<Inventaire[]>(`${this.apiUrl}/inventaires/date/${date.toISOString()}`);
  }

  // Récupérer toutes les boutiques
  getBoutiques(): Observable<Depot[]> {
    
    return this.http.get<Depot[]>(`${this.apiUrl}/depots-boutique`);
  }

  // Récupérer toutes les catégories
  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/categories`);
  }

  // Récupérer tous les dépôts (magasins de stock purs, sans boutique -
  // /depots n'existe pas cote serveur, /depots-stockage est le bon endpoint,
  // deja utilise ailleurs dans l'application pour cette meme liste).
  getDepots(): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.apiUrl}/depots-stockage`);
  }

  // Récupérer les dates d'inventaire disponibles
  getDatesInventaire(): Observable<Date[]> {
    return this.http.get<Date[]>(`${this.apiUrl}/inventaires/dates`);
  }

  // Imprimer l'inventaire
  printInventaire(filter?: InventaireFilter): Observable<Blob> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.reference) params = params.set('reference', filter.reference);
      if (filter.libelle) params = params.set('libelle', filter.libelle);
      if (filter.boutique) params = params.set('boutique', filter.boutique.toString());
      if (filter.categorie) params = params.set('categorie', filter.categorie.toString());
      if (filter.depot) params = params.set('depot', filter.depot.toString());
      if (filter.dateInventaire) params = params.set('dateInventaire', filter.dateInventaire.toISOString());
    }
    
    return this.http.get(`${this.apiUrl}/inventaires/print`, { 
      params, 
      responseType: 'blob' 
    });
  }
}