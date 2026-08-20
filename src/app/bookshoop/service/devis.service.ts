import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { DevisFilter } from '../model/devis-filter';
import { Devis } from '../model/devis';
import { AuthService } from '../../auth/auth.service';

/**
 * ============================================================================
 * SERVICE DE GESTION DES DEVIS - ANGULAR 18
 * ============================================================================
 * 
 * Ce service gère toutes les opérations liées aux devis côté frontend.
 * Il communique avec l'API backend Spring Boot via HTTP.
 * 
 * FONCTIONNALITÉS PRINCIPALES:
 * =============================
 * 
 * 1. CRÉATION ET MODIFICATION
 *    - Créer un nouveau devis
 *    - Modifier un devis existant
 *    - Dupliquer un devis
 * 
 * 2. CONSULTATION
 *    - Lister tous les devis
 *    - Récupérer un devis par ID
 *    - Rechercher par numéro
 *    - Liste paginée
 * 
 * 3. FILTRES ET RECHERCHES
 *    - Filtrer par client
 *    - Filtrer par statut
 *    - Filtrer par période
 * 
 * 4. CYCLE DE VIE
 *    - Accepter un devis
 *    - Refuser un devis
 *    - Annuler un devis
 * 
 * 5. ALERTES
 *    - Devis proches de l'expiration
 *    - Devis expirés
 * 
 * 6. STATISTIQUES
 *    - Statistiques globales
 *    - CA potentiel
 *    - Taux de conversion
 * 
 * 7. EXPORTS
 *    - Générer PDF
 *    - Générer Excel
 *    - Exporter CSV
 * 
 * @author Votre Équipe
 * @version 2.0
 * @since Angular 18
 */

/**
 * Interface pour les réponses API standardisées du backend
 */
export interface ApiResponse<T> {
  success?: boolean;      // Indicateur de succès
  message?: string;       // Message descriptif
  data?: T;              // Données retournées
  error?: string;        // Message d'erreur
  errors?: string[];     // Liste d'erreurs
  timestamp?: string;    // Timestamp de la réponse
  status?: number;       // Code HTTP
  total?: number;        // Total d'éléments (pour pagination)
  devisId?: number;      // ID du devis créé
  numeroDevis?: string;  // Numéro du devis créé
}

/**
 * Interface pour la pagination
 */
export interface PageRequest {
  page: number;          // Numéro de page (commence à 0)
  size: number;          // Nombre d'éléments par page
  sort?: string;         // Champ de tri
  direction?: 'asc' | 'desc';  // Direction du tri
}

/**
 * Interface pour les erreurs formatées
 */
export interface ErrorResponse {
  status: number;        // Code HTTP de l'erreur
  message: string;       // Message d'erreur formaté
  fullError?: any;       // Erreur complète pour debug
}

/**
 * Interface pour les statistiques
 */
export interface DevisStatistics {
  total_devis: number;
  par_statut: { [key: string]: number };
  ca_potentiel: number;
  taux_conversion: number;
  proches_expiration: number;
  expires: number;
}

@Injectable({
  providedIn: 'root'
})
export class DevisService {
  
  // ========================================================================
  // CONFIGURATION
  // ========================================================================
  
  /**
   * URL de base de l'API des devis
   * Correspond à l'endpoint du contrôleur Spring Boot: /api/v1/devis
   */
private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits/devis`
  
  /**
   * BehaviorSubject pour maintenir un cache réactif des devis
   * Permet aux composants de s'abonner et de recevoir automatiquement les mises à jour
   */
  private devisSubject = new BehaviorSubject<Devis[]>([]);
  
  /**
   * Observable public pour l'accès en lecture au cache
   */
  public devis$ = this.devisSubject.asObservable();
  
  /**
   * Constructeur - Injection du HttpClient pour les appels HTTP
   */
  constructor(private http: HttpClient,private authService:AuthService) {
    console.log('✓ DevisService initialisé - API URL:', this.apiUrl);
  }

  // ========================================================================
  // SECTION 1: CRÉATION ET MODIFICATION
  // ========================================================================

  /**
   * CRÉER UN NOUVEAU DEVIS
   * ======================
   * POST /api/v1/devis
   * 
   * Crée un nouveau devis avec articles, TVA et remises.
   * Le backend génère automatiquement le numéro de devis et calcule les montants.
   * 
   * @param devis - Données du devis à créer
   * @param username - Nom de l'utilisateur créant le devis
   * @returns Observable avec la réponse contenant le devis créé
   * 
   * STRUCTURE DU PAYLOAD:
   * {
   *   "clientId": number,
   *   "appliquerTVA": boolean,
   *   "tauxTVA": number,
   *   "validiteJours": number,
   *   "remarques": string,
   *   "items": [
   *     {
   *       "produitId": number,
   *       "quantite": number,
   *       "prixUnitaire": number,
   *       "tauxRemise": number
   *     }
   *   ]
   * }
   */
  creerDevis(devis: any, username: string): Observable<ApiResponse<Devis>> {
    // Préparer les headers avec le nom d'utilisateur
    const headers = new HttpHeaders({ 'X-Username': username });
    
    //console.log('📤 POST /api/v1/devis', { devis, username });
    
    return this.http.post<ApiResponse<Devis>>(this.apiUrl, devis, { headers })
      .pipe(
        tap(response => console.log('✓ Devis créé:', response)),
        map(response => {
          // Extraire les données du devis créé
          const devisData = response.data || response as any;
          const message = response.message || 'Devis créé avec succès';
          
          // Mettre à jour le cache local (ajout en début de liste)
          if (devisData) {
            const devisList = this.devisSubject.value;
            this.devisSubject.next([devisData as Devis, ...devisList]);
          }
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * MODIFIER UN DEVIS EXISTANT
   * ===========================
   * PUT /api/v1/devis/{id}
   * 
   * Modifie un devis existant (uniquement si statut = EN_ATTENTE).
   * Les montants sont recalculés automatiquement par le backend.
   * 
   * @param id - ID du devis à modifier
   * @param devis - Nouvelles données du devis
   * @param username - Nom de l'utilisateur effectuant la modification
   * @returns Observable avec le devis modifié
   */
  modifierDevis(id: number, devis: any, username?: string): Observable<ApiResponse<Devis>> {
    const headers = username ? new HttpHeaders({ 'X-Username': username }) : undefined;
    
    console.log(`${this.apiUrl}/${id}`, { devis, username });
    
    return this.http.put<ApiResponse<Devis>>(`${this.apiUrl}/${id}`, devis, { headers })
      .pipe(
        tap(response => console.log('✓ Devis modifié:', response)),
        map(response => {
          const updatedDevis = response.data || response as any;
          const message = response.message || 'Devis modifié avec succès';
          
          // Mettre à jour le cache
          this.updateDevisInCache(id, updatedDevis);
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * DUPLIQUER UN DEVIS
   * ==================
   * POST /api/v1/devis/{id}/dupliquer
   * 
   * Crée une copie d'un devis existant avec un nouveau numéro et statut EN_ATTENTE.
   * Tous les articles sont copiés avec leurs prix et remises.
   * 
   * @param id - ID du devis à dupliquer
   * @param username - Nom de l'utilisateur effectuant la duplication
   * @returns Observable avec le nouveau devis créé
   */
  dupliquerDevis(id: number, username?: string): Observable<ApiResponse<Devis>> {
    const headers = username ? new HttpHeaders({ 'X-Username': username }) : undefined;
    
    console.log(`📤 POST /api/v1/devis/${id}/dupliquer`, { username });
    
    return this.http.post<ApiResponse<Devis>>(`${this.apiUrl}/${id}/dupliquer`, {}, { headers })
      .pipe(
        tap(response => console.log('✓ Devis dupliqué:', response)),
        map(response => {
          const newDevis = response.data || response as any;
          const message = response.message || 'Devis dupliqué avec succès';
          
          // Ajouter le nouveau devis au cache
          if (newDevis) {
            const devisList = this.devisSubject.value;
            this.devisSubject.next([newDevis as Devis, ...devisList]);
          }
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 2: CONSULTATION
  // ========================================================================

  /**
   * LISTER TOUS LES DEVIS
   * =====================
   * GET /api/v1/devis
   * 
   * Récupère la liste complète de tous les devis.
   * Utilise le cache réactif pour notifier tous les abonnés.
   * 
   * @returns Observable avec la liste des devis
   */
  findAll(): Observable<Devis[]> {
    console.log('📥 GET /api/v1/devis');
    const boutiqueid=this.authService.getBoutiqueByUserSession();
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/all/${boutiqueid}`)
      .pipe(
        tap(response => console.log('✓ Devis récupérés:', response.data?.length || 0)),
        map(response => {
          const devisList = response.data || response as any || [];
          
          // Mettre à jour le cache
          this.devisSubject.next(devisList);
          console.log("chargement devis poir liste ",devisList);
          
          return devisList;
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * LISTE PAGINÉE DES DEVIS
   * =======================
   * GET /api/v1/devis/paginated
   * 
   * Récupère une page de devis avec tri et filtrage.
   * 
   * @param pageRequest - Configuration de la pagination
   * @returns Observable avec la page de devis
   */
  findAllPaginated(pageRequest: PageRequest): Observable<ApiResponse<Devis[]>> {
    let params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('size', pageRequest.size.toString());
    
    if (pageRequest.sort) {
      params = params.set('sort', pageRequest.sort);
    }
    if (pageRequest.direction) {
      params = params.set('direction', pageRequest.direction);
    }
    
    console.log('📥 GET /api/v1/devis/paginated', pageRequest);
    
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/paginated`, { params })
      .pipe(
        tap(response => console.log('✓ Page récupérée:', response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * RÉCUPÉRER UN DEVIS PAR ID
   * =========================
   * GET /api/v1/devis/{id}
   * 
   * Récupère les détails complets d'un devis spécifique.
   * 
   * @param id - ID du devis
   * @returns Observable avec le devis
   */
  findById(id: number): Observable<Devis> {
    console.log(`📥 GET /api/v1/devis/${id}`);
    
    return this.http.get<ApiResponse<Devis>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => console.log('✓ Devis récupéré:', response)),
        map(response => response.data || response as Devis),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * RECHERCHER UN DEVIS PAR NUMÉRO
   * ===============================
   * GET /api/v1/devis/numero/{numero}
   * 
   * Recherche un devis par son numéro unique (ex: DEV-2025-0001).
   * 
   * @param numero - Numéro du devis
   * @returns Observable avec le devis trouvé
   */
  findByNumero(numero: string): Observable<Devis> {
    console.log(`📥 GET /api/v1/devis/numero/${numero}`);
    
    return this.http.get<ApiResponse<Devis>>(`${this.apiUrl}/numero/${numero}`)
      .pipe(
        tap(response => console.log('✓ Devis trouvé:', response)),
        map(response => response.data || response as Devis),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 3: FILTRES ET RECHERCHES
  // ========================================================================

  /**
   * FILTRER PAR CLIENT
   * ==================
   * GET /api/v1/devis/client/{clientId}
   * 
   * Récupère tous les devis d'un client spécifique.
   * 
   * @param clientId - ID du client
   * @returns Observable avec la liste des devis du client
   */
  findByClientId(clientId: number): Observable<Devis[]> {
    console.log(`📥 GET /api/v1/devis/client/${clientId}`);
    
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/client/${clientId}`)
      .pipe(
        tap(response => console.log('✓ Devis du client récupérés:', response.data?.length || 0)),
        map(response => response.data || response as Devis[]),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * FILTRER PAR STATUT
   * ==================
   * GET /api/v1/devis/statut/{statut}
   * 
   * Récupère tous les devis ayant un statut donné.
   * Statuts possibles: EN_ATTENTE, ACCEPTE, REFUSE, CONVERTI, ANNULE
   * 
   * @param statut - Statut recherché
   * @returns Observable avec la liste des devis
   */
  findByStatut(statut: string): Observable<Devis[]> {
    console.log(`📥 GET /api/v1/devis/statut/${statut}`);
    
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/statut/${statut}`)
      .pipe(
        tap(response => console.log('✓ Devis par statut récupérés:', response.data?.length || 0)),
        map(response => response.data || response as Devis[]),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * FILTRER PAR PÉRIODE
   * ===================
   * GET /api/v1/devis/periode
   * 
   * Récupère les devis créés dans une période donnée.
   * 
   * @param dateDebut - Date de début (format: yyyy-MM-dd)
   * @param dateFin - Date de fin (format: yyyy-MM-dd)
   * @returns Observable avec la liste des devis
   */
  findByPeriode(dateDebut: string, dateFin: string): Observable<Devis[]> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    
    console.log(`📥 GET /api/v1/devis/periode`, { dateDebut, dateFin });
    
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/periode`, { params })
      .pipe(
        tap(response => console.log('✓ Devis de la période récupérés:', response.data?.length || 0)),
        map(response => response.data || response as Devis[]),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * RECHERCHE AVEC FILTRES COMPLEXES
   * =================================
   * Filtre local des devis selon plusieurs critères.
   * Note: Cette méthode filtre côté client, contrairement aux autres qui filtrent côté serveur.
   * 
   * @param filtres - Objet contenant les critères de filtrage
   * @returns Observable avec les devis filtrés
   */
  findByFilters(filtres: DevisFilter): Observable<Devis[]> {
    // Pour une implémentation serveur, vous pourriez créer un endpoint POST /api/v1/devis/search
    // Ici, on filtre localement depuis le cache
    const devisList = this.devisSubject.value;
    
    let filtered = [...devisList];
    
    if (filtres.clientId) {
      filtered = filtered.filter(d => d.client?.id === filtres.clientId);
    }
    
    if (filtres.statut) {
      filtered = filtered.filter(d => d.statut === filtres.statut);
    }
    
    if (filtres.dateFrom) {
      const dateFrom = new Date(filtres.dateFrom);
      filtered = filtered.filter(d => new Date(d.dateDevis) >= dateFrom);
    }
    
    if (filtres.dateTo) {
      const dateTo = new Date(filtres.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => new Date(d.dateDevis) <= dateTo);
    }
    
    return new Observable(subscriber => {
      subscriber.next(filtered);
      subscriber.complete();
    });
  }

  // ========================================================================
  // SECTION 4: GESTION DU CYCLE DE VIE
  // ========================================================================

  /**
   * ACCEPTER UN DEVIS
   * =================
   * PUT /api/v1/devis/{id}/accepter
   * 
   * Change le statut du devis en ACCEPTE.
   * Seuls les devis EN_ATTENTE peuvent être acceptés.
   * 
   * @param id - ID du devis
   * @param username - Nom de l'utilisateur
   * @returns Observable avec le devis mis à jour
   */
  accepterDevis(id: number, username?: string): Observable<ApiResponse<Devis>> {
    const headers = username ? new HttpHeaders({ 'X-Username': username }) : undefined;
    
    console.log(`📤 PUT /api/v1/devis/${id}/accepter`);
    const anneeid=this.authService.getAnneeByUserSession();
    
    return this.http.put<ApiResponse<Devis>>(`${this.apiUrl}/${id}/accepter/${anneeid}`, {}, { headers })
      .pipe(
        tap(response => console.log('✓ Devis accepté:', response)),
        map(response => {
          const updatedDevis = response.data || response as any;
          const message = response.message || 'Devis accepté avec succès';
          
          // Mettre à jour le cache
          this.updateDevisInCache(id, updatedDevis);
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * REFUSER UN DEVIS
   * ================
   * PUT /api/v1/devis/{id}/refuser
   * 
   * Change le statut du devis en REFUSE.
   * Un motif de refus peut être fourni.
   * 
   * @param id - ID du devis
   * @param motif - Motif du refus (optionnel)
   * @param username - Nom de l'utilisateur
   * @returns Observable avec le devis mis à jour
   */
  refuserDevis(id: number, motif?: string, username?: string): Observable<ApiResponse<Devis>> {
    const headers = username ? new HttpHeaders({ 'X-Username': username }) : undefined;
    const body = motif ? { motif } : {};
    
    console.log(`📤 PUT /api/v1/devis/${id}/refuser`, { motif });
    
    return this.http.put<ApiResponse<Devis>>(`${this.apiUrl}/${id}/refuser`, body, { headers })
      .pipe(
        tap(response => console.log('✓ Devis refusé:', response)),
        map(response => {
          const updatedDevis = response.data || response as any;
          const message = response.message || 'Devis refusé';
          
          // Mettre à jour le cache
          this.updateDevisInCache(id, updatedDevis);
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * ANNULER UN DEVIS
   * ================
   * PUT /api/v1/devis/{id}/annuler
   * 
   * Annule un devis (statut ANNULE).
   * Impossible si le devis a déjà été converti en facture.
   * 
   * @param id - ID du devis
   * @param motif - Motif de l'annulation (requis)
   * @param username - Nom de l'utilisateur
   * @returns Observable avec le devis mis à jour
   */
  annulerDevis(id: number, motif: string, username?: string): Observable<ApiResponse<Devis>> {
    const headers = username ? new HttpHeaders({ 'X-Username': username }) : undefined;
    const body = { motif };
    
    console.log(`📤 PUT /api/v1/devis/${id}/annuler`, { motif });
    
    return this.http.put<ApiResponse<Devis>>(`${this.apiUrl}/${id}/annuler`, body, { headers })
      .pipe(
        tap(response => console.log('✓ Devis annulé:', response)),
        map(response => {
          const updatedDevis = response.data || response as any;
          const message = response.message || 'Devis annulé';
          
          // Mettre à jour le cache
          this.updateDevisInCache(id, updatedDevis);
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 4bis: COMMANDES EN LIGNE (voir CommandeEnLigneController)
  // ========================================================================

  /**
   * LISTER LES COMMANDES EN LIGNE
   * =============================
   * GET /microservice-produits/commandes-en-ligne?statut=X&boutiqueid=Y
   *
   * Uniquement les devis d'origine EN_LIGNE (site public e-commerce) -
   * jamais les devis crees en interne par le personnel, filtre deja fait
   * cote serveur (voir DevisService.findCommandesEnLigne).
   */
  findCommandesEnLigne(statut: string, boutiqueid: number): Observable<Devis[]> {
    const commandesUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/commandes-en-ligne`;
    const params = new HttpParams().set('statut', statut).set('boutiqueid', boutiqueid.toString());

    return this.http.get<ApiResponse<Devis[]>>(commandesUrl, { params })
      .pipe(
        map(response => response.data || (response as any) || []),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * VALIDER ET FACTURER UNE COMMANDE EN LIGNE (one-click)
   * =======================================================
   * POST /microservice-produits/commandes-en-ligne/{devisId}/valider-et-facturer
   *
   * Enchaine accepter -> convertir en facture -> valider la facture (qui
   * deduit le stock) en une seule action, plutot que 3 ecrans separes -
   * voir CommandeEnLigneController.
   */
  validerEtFacturerCommandeEnLigne(devisId: number): Observable<any> {
    const commandesUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/commandes-en-ligne`;
    return this.http.post<any>(`${commandesUrl}/${devisId}/valider-et-facturer`, {})
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 5: ALERTES ET NOTIFICATIONS
  // ========================================================================

  /**
   * DEVIS PROCHES DE L'EXPIRATION
   * ==============================
   * GET /api/v1/devis/expiration/proches
   * 
   * Récupère les devis EN_ATTENTE qui expirent dans moins de 3 jours.
   * Utile pour les alertes et notifications.
   * 
   * @returns Observable avec la liste des devis
   */
  getDevisProchesExpiration(): Observable<Devis[]> {
    console.log('📥 GET /api/v1/devis/expiration/proches');
    
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/expiration/proches`)
      .pipe(
        tap(response => console.log('✓ Devis proches expiration:', response.data?.length || 0)),
        map(response => response.data || response as Devis[]),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * DEVIS EXPIRÉS
   * =============
   * GET /api/v1/devis/expiration/expires
   * 
   * Récupère les devis EN_ATTENTE dont la date de validité est dépassée.
   * 
   * @returns Observable avec la liste des devis expirés
   */
  getDevisExpires(): Observable<Devis[]> {
    console.log('📥 GET /api/v1/devis/expiration/expires');
    
    return this.http.get<ApiResponse<Devis[]>>(`${this.apiUrl}/expiration/expires`)
      .pipe(
        tap(response => console.log('✓ Devis expirés:', response.data?.length || 0)),
        map(response => response.data || response as Devis[]),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 6: STATISTIQUES ET REPORTING
  // ========================================================================

  /**
   * STATISTIQUES GLOBALES
   * =====================
   * GET /api/v1/devis/stats
   * 
   * Récupère un rapport complet des statistiques:
   * - Total devis
   * - Répartition par statut
   * - CA potentiel
   * - Taux de conversion
   * - Alertes expiration
   * 
   * @returns Observable avec les statistiques
   */
  getStatistiques(): Observable<DevisStatistics> {
    console.log('📥 GET /api/v1/devis/stats');
    
    return this.http.get<ApiResponse<DevisStatistics>>(`${this.apiUrl}/stats`)
      .pipe(
        tap(response => console.log('✓ Statistiques récupérées:', response)),
        map(response => response.data || response as any),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * CHIFFRE D'AFFAIRES POTENTIEL
   * =============================
   * GET /api/v1/devis/stats/ca-potentiel
   * 
   * Calcule le CA potentiel (somme des devis EN_ATTENTE + ACCEPTE).
   * 
   * @returns Observable avec le montant du CA potentiel
   */
  getChiffreAffairesPotentiel(): Observable<number> {
    console.log('📥 GET /api/v1/devis/stats/ca-potentiel');
    
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/ca-potentiel`)
      .pipe(
        tap(response => console.log('✓ CA potentiel:', response)),
        map(response =>  response.data?.caPotentiel || 0),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * TAUX DE CONVERSION
   * ==================
   * GET /api/v1/devis/stats/taux-conversion
   * 
   * Calcule le taux de conversion (devis acceptés/convertis / total devis).
   * 
   * @returns Observable avec le taux en pourcentage
   */
  getTauxConversion(): Observable<number> {
    console.log('📥 GET /api/v1/devis/stats/taux-conversion');
    
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/taux-conversion`)
      .pipe(
        tap(response => console.log('✓ Taux conversion:', response)),
        map(response =>  response.data?.tauxConversion || 0),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 7: EXPORTS ET GÉNÉRATION DE DOCUMENTS
  // ========================================================================

  /**
   * GÉNÉRER PDF
   * ===========
   * GET /api/v1/devis/{id}/pdf
   * 
   * Génère et télécharge un PDF du devis.
   * 
   * @param id - ID du devis
   * @returns Observable avec le fichier Blob
   */
  genererPdf(id: number): Observable<Blob> {
    console.log(`📥 GET /api/v1/devis/${id}/pdf`);
    
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' })
      .pipe(
        tap(blob => {
          console.log('✓ PDF généré, taille:', blob.size, 'bytes');
          // Télécharger automatiquement le fichier
          this.downloadFile(blob, `devis_${id}.pdf`, 'application/pdf');
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * GÉNÉRER EXCEL
   * =============
   * GET /api/v1/devis/{id}/excel
   * 
   * Génère et télécharge un fichier Excel du devis.
   * 
   * @param id - ID du devis
   * @returns Observable avec le fichier Blob
   */
  genererExcel(id: number): Observable<Blob> {
    console.log(`📥 GET /api/v1/devis/${id}/excel`);
    
    return this.http.get(`${this.apiUrl}/${id}/excel`, { responseType: 'blob' })
      .pipe(
        tap(blob => {
          console.log('✓ Excel généré, taille:', blob.size, 'bytes');
          this.downloadFile(blob, `devis_${id}.xlsx`, 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * EXPORTER EN CSV
   * ===============
   * GET /api/v1/devis/export/csv
   * 
   * Exporte tous les devis (ou filtrés) en format CSV.
   * 
   * @param filtres - Filtres optionnels
   * @returns Observable avec le fichier Blob
   */
  exporterCsv(filtres?: DevisFilter): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtres) {
      if (filtres.clientId) params = params.set('clientId', filtres.clientId.toString());
      if (filtres.statut) params = params.set('statut', filtres.statut);
      if (filtres.dateFrom) params = params.set('dateFrom', filtres.dateFrom);
      if (filtres.dateTo) params = params.set('dateTo', filtres.dateTo);
    }

    console.log('📥 GET /api/v1/devis/export/csv', filtres);
    
    return this.http.get(`${this.apiUrl}/export/csv`, { params, responseType: 'blob' })
      .pipe(
        tap(blob => {
          console.log('✓ CSV exporté, taille:', blob.size, 'bytes');
          this.downloadFile(blob, `devis_export_${Date.now()}.csv`, 'text/csv');
        }),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 8: OPÉRATIONS DE SUPPRESSION
  // ========================================================================

  /**
   * SUPPRIMER UN DEVIS
   * ==================
   * DELETE /api/v1/devis/{id}
   * 
   * Supprime définitivement un devis.
   * Généralement réservé aux administrateurs.
   * 
   * @param id - ID du devis à supprimer
   * @returns Observable avec le résultat
   */
  supprimerDevis(id: number): Observable<ApiResponse<void>> {
    console.log(`📤 DELETE /api/v1/devis/${id}`);
    
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => console.log('✓ Devis supprimé')),
        map(response => {
          const message = response.message || 'Devis supprimé avec succès';
          
          // Retirer du cache
          const devisList = this.devisSubject.value.filter(d => d.id !== id);
          this.devisSubject.next(devisList);
          
          return { ...response, message };
        }),
        catchError(error => this.handleError(error))
      );
  }

  // ========================================================================
  // SECTION 9: GESTION DU CACHE ET UTILITAIRES
  // ========================================================================

  /**
   * Récupérer la liste des devis depuis le cache
   * Sans faire d'appel API
   */
  getDevisFromCache(): Devis[] {
    return this.devisSubject.value;
  }

  /**
   * Actualiser manuellement la liste des devis
   * Force un rechargement depuis l'API
   */
  refreshDevis(): Observable<Devis[]> {
    console.log('🔄 Actualisation des devis...');
    return this.findAll();
  }

  /**
   * Vider le cache local
   * Utile lors de la déconnexion
   */
  clearCache(): void {
    console.log('🗑️ Cache vidé');
    this.devisSubject.next([]);
  }

  /**
   * Mettre à jour un devis dans le cache local
   * @private
   */
  private updateDevisInCache(id: number, updatedDevis: Devis): void {
    const devisList = this.devisSubject.value;
    const index = devisList.findIndex(d => d.id === id);
    
    if (index !== -1) {
      devisList[index] = updatedDevis;
      this.devisSubject.next([...devisList]);
      console.log(`✓ Cache mis à jour pour devis ID ${id}`);
    }
  }

  /**
   * Télécharger un fichier Blob
   * Crée un lien temporaire et déclenche le téléchargement
   * @private
   */
  private downloadFile(blob: Blob, filename: string, mimeType: string): void {
    const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    console.log(`✓ Fichier téléchargé: ${filename}`);
  }

  // ========================================================================
  // SECTION 10: GESTION DES ERREURS
  // ========================================================================

  /**
   * GESTION CENTRALISÉE DES ERREURS HTTP
   * =====================================
   * 
   * Cette méthode intercepte toutes les erreurs HTTP et les formate
   * de manière cohérente pour les composants.
   * 
   * @private
   * @param error - Erreur HTTP reçue
   * @returns Observable avec une erreur formatée
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    let detailedMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (réseau, etc.)
      errorMessage = 'Erreur de connexion';
      detailedMessage = error.error.message;
      console.error('❌ Erreur client:', error.error.message);
    } else {
      // Erreur côté serveur
      console.error('❌ Erreur serveur:', {
        status: error.status,
        message: error.message,
        body: error.error
      });

      // Extraction du message d'erreur du backend
      detailedMessage = this.extractErrorMessage(error);

      // Messages spécifiques selon le code HTTP
      errorMessage = this.getHttpErrorMessage(error.status);
    }

    const finalMessage = detailedMessage || errorMessage;

    // Retourner l'erreur formatée
    return throwError(() => ({
      status: error.status,
      message: finalMessage,
      fullError: error
    } as ErrorResponse));
  }

  /**
   * Extrait le message d'erreur selon différentes structures possibles
   * Le backend peut retourner l'erreur dans plusieurs formats
   * @private
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (!error.error) return '';

    // Structure 1: error.error est une string
    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error);
        return parsed.message || parsed.error || error.error;
      } catch {
        return error.error;
      }
    }

    // Structure 2: error.error.message
    if (error.error.message) {
      return error.error.message;
    }

    // Structure 3: error.error.error
    if (error.error.error) {
      return error.error.error;
    }

    // Structure 4: error.error.details
    if (error.error.details) {
      return error.error.details;
    }

    // Structure 5: error.error.errors (tableau)
    if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
      return error.error.errors.join(', ');
    }

    // Structure 6: error.message (niveau racine)
    if (error.message) {
      return error.message;
    }

    return '';
  }

  /**
   * Retourne un message d'erreur selon le code HTTP
   * @private
   */
  private getHttpErrorMessage(status: number): string {
    const messages: { [key: number]: string } = {
      400: 'Données invalides',
      401: 'Non autorisé - Veuillez vous connecter',
      403: 'Accès interdit',
      404: 'Ressource non trouvée',
      409: 'Conflit de données',
      422: 'Données non traitables',
      500: 'Erreur serveur interne',
      502: 'Passerelle incorrecte',
      503: 'Service temporairement indisponible',
      504: 'Délai d\'attente de la passerelle dépassé'
    };

    return messages[status] || `Erreur ${status}`;
  }

  /**
   * MÉTHODE UTILITAIRE PUBLIQUE
   * ============================
   * 
   * Extrait le message d'une erreur (utilisable depuis les composants).
   * 
   * @param error - Erreur quelconque
   * @returns Message d'erreur formaté
   */
  public getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (typeof error?.error === 'string') {
      return error.error;
    }
    return 'Une erreur est survenue';
  }

  // ========================================================================
  // SECTION 11: ALIAS POUR COMPATIBILITÉ
  // ========================================================================

  /**
   * Alias pour findById() - pour compatibilité avec l'ancien code
   */
  getDevis(id: number): Observable<Devis> {
    return this.findById(id);
  }

  /**
   * Alias pour findAll() - pour compatibilité avec l'ancien code
   */
  listDevis(): Observable<Devis[]> {
    return this.findAll();
  }

  /**
   * Alias pour modifierDevis() - pour compatibilité avec l'ancien code
   */
  updateDevis(id: number, devis: any, username?: string): Observable<ApiResponse<Devis>> {
    console.log("update devis :",devis)
    return this.modifierDevis(id, devis, username);
  }

  /**
   * Alias pour genererPdf() - pour compatibilité avec l'ancien code
   */
  genererPdfDevis(id: number): Observable<Blob> {
    return this.genererPdf(id);
  }
}