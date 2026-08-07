import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Entreprise } from '../model/Entreprise';
import { EntrepriseRequest } from '../model/EntrepriseRequest';
import { EntrepriseSearchFilters } from '../model/EntrepriseSearchFilters';

/**
 * Service Angular pour la gestion des exercices (Entreprise = Annee x
 * Compagnie) de la compagnie de l'utilisateur connecte. La compagnie n'est
 * jamais un parametre de ces appels - toujours derivee du token cote backend.
 *
 * @author Système de Gestion
 */
@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {

  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/entreprises`;

  constructor(private http: HttpClient) { }

  /**
   * Liste tous les exercices de ma compagnie
   */
  findAll(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(this.apiUrl);
  }

  /**
   * Récupère l'exercice d'une année pour ma compagnie
   */
  findById(anneeId: number): Observable<Entreprise> {
    return this.http.get<Entreprise>(`${this.apiUrl}/${anneeId}`);
  }

  /**
   * Crée un nouvel exercice pour ma compagnie
   */
  create(request: EntrepriseRequest): Observable<Entreprise> {
    return this.http.post<Entreprise>(this.apiUrl, request);
  }

  /**
   * Met à jour un exercice
   */
  update(anneeId: number, request: EntrepriseRequest): Observable<Entreprise> {
    return this.http.put<Entreprise>(`${this.apiUrl}/${anneeId}`, request);
  }

  /**
   * Supprime un exercice
   */
  delete(anneeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${anneeId}`);
  }

  /**
   * Liste les exercices actifs de ma compagnie
   */
  findAllActive(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(`${this.apiUrl}/active`);
  }

  /**
   * Liste les exercices de ma compagnie pour une année
   */
  findByAnnee(anneeId: number): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(`${this.apiUrl}/annee/${anneeId}`);
  }

  /**
   * Recherche d'exercices avec filtres
   */
  search(filters: EntrepriseSearchFilters): Observable<Entreprise[]> {
    let params = new HttpParams();

    if (filters.anneeId) {
      params = params.set('anneeId', filters.anneeId.toString());
    }
    if (filters.actif !== undefined) {
      params = params.set('actif', filters.actif.toString());
    }
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }

    return this.http.get<Entreprise[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Active un exercice par défaut (désactive automatiquement les autres)
   */
  activerParDefaut(anneeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${anneeId}/activer`, {});
  }

  /**
   * Récupère l'exercice actif par défaut
   */
  getEntrepriseActive(): Observable<Entreprise> {
    return this.http.get<Entreprise>(`${this.apiUrl}/active`);
  }
}
