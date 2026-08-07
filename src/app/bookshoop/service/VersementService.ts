// src/app/core/services/versement.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { ToastrService } from 'ngx-toastr';
import { VersementCreateRequest } from '../model/VersementCreateRequest';
import { VersementResponse } from '../model/VersementResponse';
import { VersementMultipleRequest } from '../model/VersementMultipleRequest';
import { VersementValidationRequest } from '../model/VersementValidationRequest';
import { VersementSearchCriteria } from '../model/VersementSearchCriteria';
import { VersementStatistiques } from '../model/VersementStatistiques';
import { HistoriquePaiementClient } from '../model/HistoriquePaiementClient';
import { RecuPaiementDTO } from '../model/RecuPaiementDTO';
import { VersementAnnulationRequest } from '../model/VersementAnnulationRequest';
import { Client } from '../model/client';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VersementService {
  private apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/versement`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private autService: AuthService
  ) { }

  /**
   * Crée un nouveau versement
   */
  creerVersement(request: VersementCreateRequest): Observable<VersementResponse> {
    return this.http.post<VersementResponse>(this.apiUrl, request)
      .pipe(
        map(response => {
          this.toastr.success('Versement enregistré avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'enregistrement du versement'))
      );
  }

  /**
   * Crée plusieurs versements
   */
  creerVersementsMultiples(request: VersementMultipleRequest): Observable<VersementResponse[]> {
    return this.http.post<VersementResponse[]>(`${this.apiUrl}/multiple`, request)
      .pipe(
        map(response => {
          this.toastr.success(`${response.length} versements enregistrés avec succès`, 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'enregistrement des versements'))
      );
  }

  /**
   * Valide un versement
   */
  validerVersement(id: number, request: VersementValidationRequest): Observable<VersementResponse> {
    return this.http.post<VersementResponse>(`${this.apiUrl}/${id}/valider`, request)
      .pipe(
        map(response => {
          this.toastr.success('Versement validé avec succès', 'Succès');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la validation du versement'))
      );
  }

  /**
   * Annule un versement
   */
  annulerVersement(id: number, request: VersementAnnulationRequest): Observable<VersementResponse> {
    return this.http.post<VersementResponse>(`${this.apiUrl}/${id}/annuler`, request)
      .pipe(
        map(response => {
          this.toastr.warning('Versement annulé', 'Attention');
          return response;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'annulation du versement'))
      );
  }

  /**
   * Récupère  les client ayant deja effectuer un payement
   */
  getClient(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/all-client`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des clients '))
      );
  }
  /**
   * Récupère un versement par son ID
   */
  getVersement(id: number): Observable<VersementResponse> {
    return this.http.get<VersementResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération du versement'))
      );
  }

  /**
   * Récupère un versement par son numéro
   */
  getVersementParNumero(numero: string): Observable<VersementResponse> {
    return this.http.get<VersementResponse>(`${this.apiUrl}/numero/${numero}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération du versement'))
      );
  }

  /**
   * Liste les versements avec pagination et filtres
   */
  listerVersements(criteria: VersementSearchCriteria): Observable<any> {
    const boutiqueid=this.autService.getBoutiqueByUserSession();
    let params = new HttpParams();
    if (boutiqueid) params = params.set('boutiqueid', boutiqueid);
    if (criteria.numeroVersement) params = params.set('numeroVersement', criteria.numeroVersement);
    if (criteria.factureId) params = params.set('factureId', criteria.factureId.toString());
    if (criteria.clientId) params = params.set('clientId', criteria.clientId.toString());
    if (criteria.modePaiement) params = params.set('modePaiement', criteria.modePaiement);
    if (criteria.statut) params = params.set('statut', criteria.statut);
    if (criteria.dateVersementDebut) params = params.set('dateVersementDebut', this.formatDate(criteria.dateVersementDebut));
    if (criteria.dateVersementFin) params = params.set('dateVersementFin', this.formatDate(criteria.dateVersementFin));
    if (criteria.referencePaiement) params = params.set('referencePaiement', criteria.referencePaiement);
    if (criteria.page !== undefined) params = params.set('page', criteria.page.toString());
    if (criteria.size !== undefined) params = params.set('size', criteria.size.toString());
    if (criteria.sortBy) params = params.set('sortBy', criteria.sortBy);
    if (criteria.sortDirection) params = params.set('sortDirection', criteria.sortDirection);

    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des versements'))
      );
  }

  /**
   * Récupère les versements d'une facture
   */
  getVersementsFacture(factureId: number): Observable<VersementResponse[]> {
    return this.http.get<VersementResponse[]>(`${this.apiUrl}/facture/${factureId}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des versements'))
      );
  }

  /**
   * Récupère les versements d'un client
   */
  getVersementsClient(clientId: number): Observable<VersementResponse[]> {
    return this.http.get<VersementResponse[]>(`${this.apiUrl}/client/${clientId}`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des versements'))
      );
  }

  /**
   * Récupère les statistiques de versements
   */
  getStatistiques(dateDebut?: Date, dateFin?: Date): Observable<VersementStatistiques> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', this.formatDate(dateDebut));
    if (dateFin) params = params.set('dateFin', this.formatDate(dateFin));

    return this.http.get<VersementStatistiques>(`${this.apiUrl}/statistiques`, { params })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des statistiques'))
      );
  }

  /**
   * Récupère l'historique de paiement d'un client
   */
  getHistoriquePaiementClient(clientId: number): Observable<HistoriquePaiementClient> {
    return this.http.get<HistoriquePaiementClient>(`${this.apiUrl}/client/${clientId}/historique`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération de l\'historique'))
      );
  }

  /**
   * Génère un reçu de paiement
   */
  genererRecuPaiement(id: number): Observable<RecuPaiementDTO> {
    return this.http.get<RecuPaiementDTO>(`${this.apiUrl}/${id}/recu`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la génération du reçu'))
      );
  }

  /**
   * Télécharge un reçu de paiement PDF
   */
  telechargerRecuPaiement(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/recu/download`, { responseType: 'blob' })
      .pipe(
        map(blob => {
          this.toastr.success('Reçu téléchargé avec succès', 'Succès');
          return blob;
        }),
        catchError(error => this.handleError(error, 'Erreur lors du téléchargement du reçu'))
      );
  }

  /**
   * Recherche avancée de versements
   */
  rechercherVersements(criteria: VersementSearchCriteria): Observable<any> {
    let params = new HttpParams();

    Object.keys(criteria).forEach(key => {
      const value = criteria[key as keyof VersementSearchCriteria];
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

  /**
   * Récupère les versements d'un client pour une période donnée
   */
  getVersementsByClientAndPeriod(
    clientId: number,
    dateDebut: Date,
    dateFin: Date
  ): Observable<VersementResponse[]> {
    let params = new HttpParams()
      .set('dateDebut', dateDebut.toISOString())
      .set('dateFin', dateFin.toISOString());

    return this.http.get<VersementResponse[]>(`${this.apiUrl}/client/${clientId}/periode`, { params })
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des versements du client'))
      );
  }

  /**
   * Génère un rapport client en PDF
   */
  genererRapportClientPDF(
    clientId: number,
    dateDebut: Date,
    dateFin: Date
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('dateDebut', dateDebut.toISOString())
      .set('dateFin', dateFin.toISOString());

    return this.http.get(`${this.apiUrl}/rapport/client/${clientId}/pdf`, {
      params,
      responseType: 'blob'
    })
      .pipe(
        map(blob => {
          this.toastr.success('Rapport PDF généré avec succès', 'Succès');
          return blob;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la génération du rapport PDF'))
      );
  }

  /**
   * Envoie le rapport par email
   */
  envoyerRapportParEmail(
    clientId: number,
    dateDebut: Date,
    dateFin: Date,
    email: string
  ): Observable<void> {
    const body = {
      clientId,
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
      email
    };

    return this.http.post<void>(`${this.apiUrl}/rapport/client/${clientId}/email`, body)
      .pipe(
        map(() => {
          this.toastr.success(`Rapport envoyé à ${email}`, 'Email envoyé');
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'envoi du rapport par email'))
      );
  }

  /**
   * Exporte le rapport en Excel
   */
  exporterRapportExcel(
    clientId: number,
    dateDebut: Date,
    dateFin: Date
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('dateDebut', dateDebut.toISOString())
      .set('dateFin', dateFin.toISOString());

    return this.http.get(`${this.apiUrl}/rapport/client/${clientId}/excel`, {
      params,
      responseType: 'blob'
    })
      .pipe(
        map(blob => {
          this.toastr.success('Export Excel généré avec succès', 'Succès');
          return blob;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l\'export Excel'))
      );
  }

  /**
   * Récupère les statistiques de versements pour un client
   */
  getStatistiquesClient(clientId: number): Observable<{
    totalVersements: number;
    totalValides: number;
    totalEnAttente: number;
    nombreVersements: number;
    dernierVersement?: Date;
  }> {
    return this.http.get<any>(`${this.apiUrl}/client/${clientId}/statistiques`)
      .pipe(
        catchError(error => this.handleError(error, 'Erreur lors de la récupération des statistiques'))
      );
  }


}