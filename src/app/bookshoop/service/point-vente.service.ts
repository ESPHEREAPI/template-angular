import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PointVente } from '../model/point-vente';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PrixArticles } from '../model/prix-articles';
import { Commande } from '../model/commande';
import { Depot } from '../model/depot';
import { Boutique } from '../model/boutique';
import { environment } from '../../../environments/environment';
import { Ville } from '../model/ville';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PointVenteService {
  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  private pointVenteSubject = new BehaviorSubject<PointVente | null>(null);
  public pointVente$ = this.pointVenteSubject.asObservable();

  constructor(private http: HttpClient,private autheService: AuthService) { }

   private getBoutiqueUser(): number {
    const user = this.autheService.getUserFromStorage();
    let boutiqueid : number=0;
    if (user) {
      console.log("user pour Boutique",user);
      if(!user.usersDTO || !user.usersDTO.boutiqueid) return 0;

      return user.usersDTO.boutiqueid;


    }
    return 0;
  }

  // Expose la boutique de l'utilisateur courant (import de prix - voir
  // PrixImportController, qui a besoin du boutiqueId explicitement).
  getBoutiqueIdCourant(): number {
    return this.getBoutiqueUser();
  }

  // Gestion des Points de Vente
  getAllPrixArticles(): Observable<PrixArticles[]> {
      let boutiqueid =this.getBoutiqueUser();
    return this.http.get<PrixArticles[]>(`${this.apiUrl}/prix-articles/all/${boutiqueid}`);
  }

  // Correction en masse des prix (voir filtre "Sans prix" - typiquement apres
  // un import Excel dont le fichier ne portait pas de colonne prix).
  definirPrixEnMasse(items: { id: number; prixVenteNet: number }[]): Observable<{ miseAJour: number; total: number }> {
    return this.http.put<{ miseAJour: number; total: number }>(`${this.apiUrl}/prix-articles/bulk-prix`, items);
  }

  // Import de prix par lot via fichier Excel (voir PrixImportController) -
  // alternative a definirPrixEnMasse pour corriger des centaines de produits
  // sans les saisir un par un dans le navigateur.
  telechargerModelePrix(boutiqueId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/gateway-proxy/api/microservice-produits/prix-import/modele`, {
      params: { boutiqueId: boutiqueId.toString() },
      responseType: 'blob'
    });
  }

  previsualiserImportPrix(fichier: File, boutiqueId: number): Observable<any> {
    const formData = new FormData();
    formData.append('fichier', fichier);
    return this.http.post<any>(
      `${environment.apiUrl}/gateway-proxy/api/microservice-produits/prix-import/previsualiser`,
      formData,
      { params: { boutiqueId: boutiqueId.toString() } }
    );
  }

  appliquerImportPrix(fichier: File, boutiqueId: number): Observable<{ miseAJour: number }> {
    const formData = new FormData();
    formData.append('fichier', fichier);
    return this.http.post<{ miseAJour: number }>(
      `${environment.apiUrl}/gateway-proxy/api/microservice-produits/prix-import/appliquer`,
      formData,
      { params: { boutiqueId: boutiqueId.toString() } }
    );
  }

  getPointVenteById(id: number): Observable<PointVente> {
    return this.http.get<PointVente>(`${this.apiUrl}/${id}`);
  }

  createPointVente(pointVente: PointVente): Observable<PointVente> {
    return this.http.post<PointVente>(this.apiUrl, pointVente);
  }

  updatePointVente(pointVente: PointVente): Observable<PointVente> {
    return this.http.put<PointVente>(`${this.apiUrl}/${pointVente.id}`, pointVente);
  }

  deletePointVente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Gestion des Commandes
  addCommande(commande: Commande): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/commandes`, commande);
  }

  updateCommande(commande: Commande): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/commandes/${commande.id}`, commande);
  }

  getCommandesByPointVente(pointVenteId: number): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/commandes/point-vente/${pointVenteId}`);
  }

  // Données de référence
  getAllDepots(): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.apiUrl}/depots-stockage`);
  }

  getAllBoutiques(): Observable<Boutique[]> {
    return this.http.get<Boutique[]>(`${this.apiUrl}/boutique`);
  }

  getAllVilles(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${this.apiUrl}/ville`);
  }

  createBoutique(boutique: Boutique): Observable<Boutique> {
    return this.http.post<Boutique>(`${this.apiUrl}/boutique`, boutique);
  }

  // Filtrage et recherche
  searchPrixArticles(searchTerm: string): Observable<PrixArticles[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<PrixArticles[]>(`${this.apiUrl}/prix-articles/search`, { params });
  }

  // Rapports et impressions
  printPointVenteByBoutique(boutiqueId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/print/boutique/${boutiqueId}`, {
      responseType: 'blob'
    });
  }

  printPointVenteByDate(boutiqueId: number, dateDebut: Date, dateFin: Date): Observable<Blob> {
    const params = new HttpParams()
      .set('boutiqueId', boutiqueId.toString())
      .set('dateDebut', dateDebut.toISOString())
      .set('dateFin', dateFin.toISOString());

    return this.http.get(`${this.apiUrl}/print/date-range`, {
      params,
      responseType: 'blob'
    });
  }

  // State Management
  setCurrentPointVente(pointVente: PointVente | null): void {
    this.pointVenteSubject.next(pointVente);
  }

  getCurrentPointVente(): PointVente | null {
    return this.pointVenteSubject.value;
  }

  // Utilitaires
  calculateEstimationStock(stockFinal: number, prixVenteNet: number): number {
    return (stockFinal || 0) * (prixVenteNet || 0);
  }

  calculatePrixTTC(prixNet: number, tva: number): number {
    return (prixNet || 0) * (1 + (tva || 0) / 100);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }
}
