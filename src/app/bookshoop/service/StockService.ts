/**
 * StockService - Service Angular
 * 
 * Service de communication avec le backend pour la gestion du stock.
 * Fournit les méthodes HTTP pour:
 * - Effectuer des transferts
 * - Récupérer le dashboard
 * - Consulter l'historique
 * - Récupérer les détails du stock
 * 
 * Utilise HttpClient pour les requêtes HTTP.
 * toutes les URLs sont basées sur l'API backend.
 * 
 * @author Système de Gestion de Stock
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransfertRequest } from '../model/TransfertRequest';
import { TransfertResponse } from '../model/TransfertResponse';
import { Dashboard } from '../model/Dashboard';
import { ValeurMagasin } from '../model/ValeurMagasin';
import { ValeurPointVente } from '../model/ValeurPointVente';
import { ProduitFaible } from '../model/ProduitFaible';
import { Evolution } from '../model/Evolution';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class StockService {

  //private apiUrl = 'http://localhost:8080/api';
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  constructor(private http: HttpClient) { }

  
  /**
   * Effectue un transfert de stock
   * 
   * @param transfert Détails du transfert
   * @return Observable de la réponse du serveur
   */
  effectuerTransfert(transfert: TransfertRequest): Observable<TransfertResponse> {
    return this.http.post<TransfertResponse>(
      `${this.apiUrl}/transferts/transferer`,
      transfert
    );
  }

  /**
   * Récupère un transfert par ID
   * 
   * @param id ID du transfert
   * @return Observable du transfert
   */
  obtenirTransfert(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transferts/${id}`);
  }

  /**
   * Liste tous les transferts
   * 
   * @return Observable de la liste
   */
  listerTransferts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transferts`);
  }

  /**
   * Récupère les transferts sortants d'un magasin
   * 
   * @param magasinId ID du magasin
   * @return Observable de la liste
   */
  obtenirTransfertsSource(magasinId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transferts/source/${magasinId}`);
  }

  /**
   * Récupère les transferts entrants vers un magasin
   * 
   * @param magasinId ID du magasin
   * @return Observable de la liste
   */
  obtenirTransfertsDestination(magasinId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transferts/destination/${magasinId}`);
  }

  /**
   * Récupère les transferts d'un produit
   * 
   * @param produitId ID du produit
   * @return Observable de la liste
   */
  obtenirTransfertsProduit(produitId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transferts/produit/${produitId}`);
  }

  /**
   * Récupère l'historique avec pagination
   * 
   * @param page Numéro de page
   * @param size Taille de page
   * @param magasinId Filtrer par magasin (optionnel)
   * @param produitId Filtrer par produit (optionnel)
   * @return Observable de la page
   */
  obtenirHistorique(page: number = 0, size: number = 20, magasinId?: number, produitId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (magasinId) {
      params = params.set('magasinId', magasinId.toString());
    }
    if (produitId) {
      params = params.set('produitId', produitId.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/transferts/historique`, { params });
  }

  /**
   * Récupère le dashboard complet
   * 
   * @return Observable du dashboard
   */
  obtenirDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.apiUrl}/dashboard-transfert-stock/stock`);
  }

  /**
   * Récupère les valeurs par magasin
   * 
   * @return Observable de la liste
   */
  obtenirValeurMagasins(): Observable<ValeurMagasin[]> {
    return this.http.get<ValeurMagasin[]>(`${this.apiUrl}/dashboard-transfert-stock/stock/magasins`);
  }

  /**
   * Récupère les valeurs par point de vente
   * 
   * @return Observable de la liste
   */
  obtenirValeurPointsVente(): Observable<ValeurPointVente[]> {
    return this.http.get<ValeurPointVente[]>(`${this.apiUrl}/dashboard-transfert-stock/stock/points-vente`);
  }

  /**
   * Récupère les produits en stock faible
   * 
   * @return Observable de la liste
   */
  obtenirProduitsFaibles(): Observable<ProduitFaible[]> {
    return this.http.get<ProduitFaible[]>(`${this.apiUrl}/dashboard-transfert-stock/stock/faible`);
  }

  /**
   * Récupère les données d'évolution
   * 
   * @return Observable de la liste
   */
  obtenirEvolution(): Observable<Evolution[]> {
    return this.http.get<Evolution[]>(`${this.apiUrl}/dashboard-transfert-stock/stock/evolution`);
  }

  /**
   * Récupère les détails du stock d'un produit
   * 
   * @param produitId ID du produit
   * @param magasinId ID du magasin
   * @return Observable des détails
   */
  obtenirDetailsStock(produitId: number, magasinId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stock-transfert/details/${produitId}/${magasinId}`);
  }

  /**
   * Récupère le stock disponible
   * 
   * @param magasinId ID du magasin
   * @param produitId ID du produit
   * @return Observable du stock
   */
  obtenirStock(magasinId: number, produitId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stock-transfert/${magasinId}/${produitId}`);
  }

  /**
   * NOUVEAU: Récupère les produits disponibles dans un dépôt spécifique avec leur stock
   * OPTIMISÉ: Une seule requête qui retourne produits + stocks pour un dépôt
   * 
   * @param depotId ID du dépôt source
   * @param anneeid ID de l'année
   * @param boutiqueid ID de la boutique
   * @return Observable de la liste des produits avec stock
   */
  getProduitsDisponiblesParDepot(depotId: number, anneeid: number, boutiqueid: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/stock-transfert/produits-disponibles/${depotId}`,
      {
        params: {
          anneeid: anneeid.toString(),
          boutiqueid: boutiqueid.toString()
        }
      }
    );
  }
}