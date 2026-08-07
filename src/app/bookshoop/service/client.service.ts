import { Injectable } from '@angular/core';
import { 
  BehaviorSubject, 
  catchError, 
  map, 
  Observable, 
  tap, 
  throwError,
  of 
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Client } from '../model/client';

interface ClientsResponse {
  content?: Client[];
  data?: Client[];
  [key: string]: any;
}

interface PaginatedResponse {
  content: Client[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/client`;
  
  // BehaviorSubjects pour partager l'état
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  public clients$ = this.clientsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Cache des clients actuels
  private clientsCourants: Client[] = [];
  private cache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {
    this.initializeCache();
  }
  // Alias pour compatibilité avec l'ancien code
listClients(): Observable<Client[]> {
  return this.http.get<Client[]>(`${this.apiUrl}/allClient`);
}

  /**
   * Initialise le système de cache
   */
  private initializeCache(): void {
    setInterval(() => {
      this.cache.clear();
    }, this.cacheExpiry);
  }

  /**
   * Obtient la clé de cache
   */
  private getCacheKey(method: string, params?: any): string {
    return `${method}_${JSON.stringify(params || {})}`;
  }

  /**
   * Récupère tous les clients
   */
  getAll(): Observable<Client[]> {
    return this.http.get<ClientsResponse>(`${this.apiUrl}/allClient`)
      .pipe(
        map((res) => this.normalizeResponse(res)),
        tap((clients) => {
          this.clientsCourants = clients;
          this.clientsSubject.next(clients);
        }),
        catchError(error => this.handleError('Erreur lors du chargement des clients'))
      );
  }

  /**
   * Récupère les clients avec pagination et filtres
   */
  getClients(
    statut?: string,
    page: number = 0,
    size: number = 20
  ): Observable<PaginatedResponse> {
    const cacheKey = this.getCacheKey('getClients', { statut, page, size });
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (statut && statut.trim() !== '') {
      params = params.set('statut', statut);
    }
    
    return this.http.get<PaginatedResponse>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          const clients = response.content || response;
          this.clientsCourants = Array.isArray(clients) ? clients : [];
          this.clientsSubject.next(this.clientsCourants);
          this.cache.set(cacheKey, response);
          this.errorSubject.next(null);
        }),
        catchError(error => this.handleError('Erreur lors de la récupération des clients'))
      );
  }

  /**
   * Récupère un client par ID
   */
  getClientById(id: number): Observable<Client> {
    const cacheKey = this.getCacheKey('getClientById', { id });
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<Client>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((client) => {
          this.cache.set(cacheKey, client);
          this.errorSubject.next(null);
        }),
        catchError(error => this.handleError(`Erreur lors de la récupération du client ${id}`))
      );
  }

  /**
   * Crée un nouveau client
   */
  createClient(client: Client): Observable<Client> {
    console.log(client);
    this.loadingSubject.next(true);
    
    return this.http.post<Client>(this.apiUrl, client)
      .pipe(
        tap((createdClient) => {
          this.clientsCourants.push(createdClient);
          this.clientsSubject.next([...this.clientsCourants]);
          this.cache.clear();
          this.errorSubject.next(null);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError('Erreur lors de la création du client');
        })
      );
  }

  /**
   * Met à jour un client
   */
  updateClient(id: number, client: Client): Observable<Client> {
        console.log(client);
    this.loadingSubject.next(true);
    
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client)
      .pipe(
        tap((updatedClient) => {
          const index = this.clientsCourants.findIndex(c => c.id === id);
          if (index !== -1) {
            this.clientsCourants[index] = updatedClient;
            this.clientsSubject.next([...this.clientsCourants]);
          }
          this.cache.clear();
          this.errorSubject.next(null);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(`Erreur lors de la mise à jour du client ${id}`);
        })
      );
  }

  /**
   * Supprime un client
   */
  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.clientsCourants = this.clientsCourants.filter(c => c.id !== id);
          this.clientsSubject.next([...this.clientsCourants]);
          this.cache.clear();
          this.errorSubject.next(null);
        }),
        catchError(error => this.handleError(`Erreur lors de la suppression du client ${id}`))
      );
  }

  /**
   * Recherche clients par statut
   */
  findByStatut(statut: string): Observable<Client[]> {
    const cacheKey = this.getCacheKey('findByStatut', { statut });
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    const params = new HttpParams().set('statut', statut);
    
    return this.http.get<Client[]>(`${this.apiUrl}/by-statut/${statut}`, { params })
      .pipe(
        tap((clients) => {
          this.cache.set(cacheKey, clients);
        }),
        catchError(error => this.handleError(`Erreur lors de la récupération des clients avec le statut ${statut}`))
      );
  }

  /**
   * Récupère tous les clients ACTIF
   */
  findAllActifs(): Observable<Client[]> {
    return this.findByStatut('ACTIF');
  }

  /**
   * Récupère tous les clients INACTIF
   */
  findAllInactifs(): Observable<Client[]> {
    return this.findByStatut('INACTIF');
  }

  /**
   * Récupère tous les clients EN_ATTENTE
   */
  findAllEnAttente(): Observable<Client[]> {
    return this.findByStatut('EN_ATTENTE');
  }

  /**
   * Cherche clients par code ou nom
   */
  searchClients(searchTerm: string): Observable<Client[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return of([]);
    }

    const cacheKey = this.getCacheKey('searchClients', { searchTerm });
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    const params = new HttpParams().set('q', searchTerm);
    
    return this.http.get<Client[]>(`${this.apiUrl}/search`, { params })
      .pipe(
        tap((clients) => {
          this.cache.set(cacheKey, clients);
        }),
        catchError(error => {
          console.error('Erreur recherche clients:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupère clients fidélité uniquement
   */
  findFidelites(): Observable<Client[]> {
    const cacheKey = 'findFidelites';
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    return this.http.get<Client[]>(`${this.apiUrl}/fidelite`)
      .pipe(
        tap((clients) => {
          this.cache.set(cacheKey, clients);
        }),
        catchError(error => this.handleError('Erreur lors de la récupération des clients fidélité'))
      );
  }

  /**
   * Récupère clients par ville
   */
  findByVille(ville: string): Observable<Client[]> {
    const cacheKey = this.getCacheKey('findByVille', { ville });
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    const params = new HttpParams().set('ville', ville);
    
    return this.http.get<Client[]>(`${this.apiUrl}/by-ville`, { params })
      .pipe(
        tap((clients) => {
          this.cache.set(cacheKey, clients);
        }),
        catchError(error => this.handleError(`Erreur lors de la récupération des clients de ${ville}`))
      );
  }

  /**
   * Récupère clients par région
   */
  findByRegion(region: string): Observable<Client[]> {
    const cacheKey = this.getCacheKey('findByRegion', { region });
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    const params = new HttpParams().set('region', region);
    
    return this.http.get<Client[]>(`${this.apiUrl}/by-region`, { params })
      .pipe(
        tap((clients) => {
          this.cache.set(cacheKey, clients);
        }),
        catchError(error => this.handleError(`Erreur lors de la récupération des clients de la région ${region}`))
      );
  }

  /**
   * Obtient les statistiques des clients
   */
  getStatistiques() {
    const total = this.clientsCourants.length;
    const actifs = this.clientsCourants.filter(c => c.statut === 'ACTIF').length;
    const inactifs = this.clientsCourants.filter(c => c.statut === 'INACTIF').length;
    const enAttente = this.clientsCourants.filter(c => c.statut === 'EN_ATTENTE').length;
    const fideles = this.clientsCourants.filter(c => c.fidelite).length;
    
    return { total, actifs, inactifs, enAttente, fideles };
  }

  /**
   * Export les clients en CSV
   */
  exportCsv(clients: Client[]): void {
    if (clients.length === 0) {
      console.warn('Aucun client à exporter');
      return;
    }
    
    const headers = ['Code', 'Nom', 'Email', 'Téléphone', 'Ville', 'Statut', 'Fidélité'];
    const rows = clients.map(c => [
      this.escapeCSV(c.code),
      this.escapeCSV(c.nom),
      this.escapeCSV(c.email),
      this.escapeCSV(c.telephone),
      this.escapeCSV(c.ville),
      //this.escapeCSV(c.statut),
      c.fidelite ? 'Oui' : 'Non'
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Échappe les caractères spéciaux pour CSV
   */
  private escapeCSV(value: string): string {
    if (!value) return '';
    return `"${value.replace(/"/g, '""')}"`;
  }

  /**
   * Normalise la réponse API
   */
  private normalizeResponse(res: ClientsResponse): Client[] {
    if (Array.isArray(res)) {
      return res;
    }
    if (res.content && Array.isArray(res.content)) {
      return res.content;
    }
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    const values = Object.values(res);
    return Array.isArray(values[0]) ? values[0] as Client[] : values as Client[];
  }

  /**
   * Gère les erreurs
   */
  private handleError(message: string): Observable<never> {
    console.error(message);
    this.errorSubject.next(message);
    return throwError(() => new Error(message));
  }

  /**
   * Utilitaires
   */
  getClientsCourants(): Client[] {
    return [...this.clientsCourants];
  }

  getClientByCode(code: string): Client | undefined {
    return this.clientsCourants.find(c => c.code === code);
  }

  codeExists(code: string): boolean {
    return this.clientsCourants.some(c => c.code === code);
  }

  resetClients(): void {
    this.clientsCourants = [];
    this.clientsSubject.next([]);
    this.cache.clear();
  }

  clearCache(): void {
    this.cache.clear();
  }
  /**
 * 🚀 OPTIMISATION: Recherche clients pour autocomplete (limité à 20 résultats)
 */
searchClientsAutocomplete(term: string, limit: number = 20): Observable<Client[]> {
  if (!term || term.trim().length === 0) {
    return of([]);
  }

  const params = new HttpParams()
    .set('q', term)
    .set('limit', limit.toString());
  
  return this.http.get<Client[]>(`${this.apiUrl}/search-autocomplete`, { params })
    .pipe(
      catchError(error => {
        console.error('Erreur recherche autocomplete:', error);
        return of([]);
      })
    );
}

/**
 * 🚀 OPTIMISATION: Récupère les N premiers clients actifs (pour chargement initial)
 */
getTopActifs(limit: number = 50): Observable<Client[]> {
  const params = new HttpParams().set('limit', limit.toString());
  
  return this.http.get<Client[]>(`${this.apiUrl}/actifs-top`, { params })
    .pipe(
      tap((clients) => {
        this.cache.set('top-actifs', clients);
      }),
      catchError(error => {
        console.error('Erreur récupération top clients:', error);
        return of([]);
      })
    );
}
}