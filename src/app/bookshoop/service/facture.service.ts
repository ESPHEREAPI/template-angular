// src/app/core/services/facture.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { ToastrService } from 'ngx-toastr';

import { FactureResponse } from '../model/FactureResponse';
import { FactureUpdateRequest } from '../model/FactureUpdateRequest';
import { FactureValidationRequest } from '../model/FactureValidationRequest';
import { FactureAnnulationRequest } from '../model/FactureAnnulationRequest';
import { FactureSearchCriteria } from '../model/FactureSearchCriteria';
import { FactureSummary } from '../model/FactureSummary';
import { FactureStatistiques } from '../model/FactureStatistiques';
import { FactureCreateRequest } from '../model/FactureCreateRequest';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/factures`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,private autService:AuthService
  ) { }

  /**
   * Crée une nouvelle facture
   */
  creerFacture(request: FactureCreateRequest): Observable<FactureResponse> {
    const boutiqueid=this.autService.getBoutiqueByUserSession();
    request.boutiqueid=boutiqueid;
    console.log("create facture",request)
    request.boutiqueid=boutiqueid;
    return this.http.post<FactureResponse>(this.apiUrl, request)
      .pipe(
        map(response => {
          this.toastr.success('Facture créée avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la création de la facture'))
      );
  }

  /**
   * Convertit un devis en facture
   */
  convertirDevisEnFacture(request: DevisToFactureRequest): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.apiUrl}/from-devis`, request)
      .pipe(
        map(response => {
          this.toastr.success('Devis converti en facture avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la conversion du devis'))
      );
  }

  /**
   * Modifie une facture (brouillon uniquement)
   */
  modifierFacture(id: number, request: FactureUpdateRequest): Observable<FactureResponse> {
    return this.http.put<FactureResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(
        map(response => {
          this.toastr.success('Facture modifiée avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la modification de la facture'))
      );
  }

  /**
   * Valide une facture (BROUILLON → NON_PAYEE)
   */
  validerFacture(id: number, request: FactureValidationRequest): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.apiUrl}/${id}/valider`, request)
      .pipe(
        map(response => {
          this.toastr.success('Facture validée avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la validation de la facture'))
      );
  }

  /**
   * Annule une facture
   */
  annulerFacture(id: number, request: FactureAnnulationRequest): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.apiUrl}/${id}/annuler`, request)
      .pipe(
        map(response => {
          this.toastr.warning('Facture annulée', 'Attention');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'annulation de la facture'))
      );
  }

  /**
   * Annule une seule ligne d'une facture (le reste de la facture reste
   * valide) - voir FactureController.annulerLigneFacture.
   */
  annulerLigneFacture(factureId: number, itemId: number, motif: string): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.apiUrl}/${factureId}/items/${itemId}/annuler`, { motif })
      .pipe(
        map(response => {
          this.toastr.warning('Article annulé', 'Attention');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'annulation de l\'article'))
      );
  }

  /**
   * Récupère une facture par son ID
   */
  getFacture(id: number): Observable<FactureResponse> {
    return this.http.get<FactureResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération de la facture'))
      );
  }

  /**
   * Récupère une facture par son numéro
   */
  getFactureParNumero(numero: string): Observable<FactureResponse> {
    return this.http.get<FactureResponse>(`${this.apiUrl}/numero/${numero}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération de la facture'))
      );
  }

  /**
   * Liste les factures avec pagination et filtres
   */
  listerFactures(criteria: FactureSearchCriteria): Observable<any> {
    const boutiqueid=this.autService.getBoutiqueByUserSession();
    let params = new HttpParams();
  console.log("boutique-facture",boutiqueid);
 if (boutiqueid) params = params.set('boutiqueid', boutiqueid);
    if (criteria.numeroFacture) params = params.set('numeroFacture', criteria.numeroFacture);
    if (criteria.clientId) params = params.set('clientId', criteria.clientId.toString());
    if (criteria.statut) params = params.set('statut', criteria.statut);
    if (criteria.dateFactureDebut) params = params.set('dateFactureDebut', this.formatDate(criteria.dateFactureDebut));
    if (criteria.dateFactureFin) params = params.set('dateFactureFin', this.formatDate(criteria.dateFactureFin));
    if (criteria.dateEcheanceDebut) params = params.set('dateEcheanceDebut', this.formatDate(criteria.dateEcheanceDebut));
    if (criteria.dateEcheanceFin) params = params.set('dateEcheanceFin', this.formatDate(criteria.dateEcheanceFin));
    if (criteria.enRetard !== undefined) params = params.set('enRetard', criteria.enRetard.toString());
    if (criteria.page !== undefined) params = params.set('page', criteria.page.toString());
    if (criteria.size !== undefined) params = params.set('size', criteria.size.toString());
    if (criteria.sortBy) params = params.set('sortBy', criteria.sortBy);
    if (criteria.sortDirection) params = params.set('sortDirection', criteria.sortDirection);

      console.log("parametre-criteria ",params);

    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des factures'))
      );
  }

  /**
   * Récupère les factures d'un client
   */
  getFacturesClient(clientId: number): Observable<FactureSummary[]> {
    const boutiqueid=this.autService.getBoutiqueByUserSession();
    return this.http.get<FactureSummary[]>(`${this.apiUrl}/client/${clientId}/${boutiqueid}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des factures du client'))
      );
  }

  /**
   * Récupère les statistiques de facturation
   */
  getStatistiques(dateDebut?: Date, dateFin?: Date): Observable<FactureStatistiques> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', this.formatDate(dateDebut));
    if (dateFin) params = params.set('dateFin', this.formatDate(dateFin));

    return this.http.get<FactureStatistiques>(`${this.apiUrl}/statistiques`, { params })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des statistiques'))
      );
  }
  getStatistiquesAll(): Observable<FactureStatistiques> {
    //let params = new HttpParams();
   // if (dateDebut) params = params.set('dateDebut', this.formatDate(dateDebut));
   // if (dateFin) params = params.set('dateFin', this.formatDate(dateFin));

    return this.http.get<FactureStatistiques>(`${this.apiUrl}/statistiques`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des statistiques'))
      );
  }

  /**
   * Recherche avancée de factures
   */
  rechercherFactures(criteria: FactureSearchCriteria): Observable<any> {
    let params = new HttpParams();

    Object.keys(criteria).forEach(key => {
      const value = criteria[key as keyof FactureSearchCriteria];
      if (value !== null && value !== undefined) {
        if (value instanceof Date) {
          params = params.set(key, this.formatDate(value));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<any>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la recherche'))
      );
  }

  /**
   * Génère un PDF de facture
   */
  genererPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la génération du PDF'))
      );
  }

  /**
   * Envoie une facture par email
   */
  envoyerParEmail(id: number, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/envoyer-email`, { email })
      .pipe(
        map(response => {
          this.toastr.success('Facture envoyée par email avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'envoi de l\'email'))
      );
  }

  /**
   * Formate une date au format yyyy-MM-dd
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any, defaultMessage: string): Observable<never> {
    console.error('Erreur:', error);
    
    let errorMessage = defaultMessage;
    
    if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.toastr.error(errorMessage, 'Erreur');
    return throwError(() => new Error(errorMessage));
  }
}

export interface DevisToFactureRequest {
  devisId: number;
  dateFacture?: Date;
  dateEcheance?: Date;
  conditionsPaiement?: string;
  remarques?: string;
  username: string;
}