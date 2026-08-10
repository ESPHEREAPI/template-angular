import { Injectable } from '@angular/core';
import { HistoriqueCaisse } from '../model/historique-caisse';
import { Mois } from '../model/mois';
import { CaisseFilter } from '../model/caisse-filter';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaymentType } from '../enums/payment-type';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Person } from '../model/person';
import { Annee } from '../model/annee';
import { environment } from '../../../environments/environment';
import { Vente } from '../model/vente';
import { User } from '../model/user';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueCaisseService {

private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  
  // Subjects pour la gestion d'état réactive
  private moisByAnneeSubject = new BehaviorSubject<Date[]>([]);
  private datesCaisseSubject = new BehaviorSubject<Date[]>([]);
  private historiqueCaisseSubject = new BehaviorSubject<Vente | null>(null);
  
  // Observables publics
  public moisByAnnee$ = this.moisByAnneeSubject.asObservable();
  public datesCaisse$ = this.datesCaisseSubject.asObservable();
  public historiqueCaisse$ = this.historiqueCaisseSubject.asObservable();

  constructor(private http: HttpClient,private authservice:AuthService) {}

  // Récupérer toutes les années
  getAllAnnees(vendeur:string): Observable<Annee[]> {
    const boutiqueid=this.authservice.getBoutiqueByUserSession();
    return this.http.get<Annee[]>(`${this.apiUrl}/${vendeur}/${boutiqueid}/annees`);
  }
getAllAnneesCaisse(): Observable<Annee[]> {
     const boutiqueid=this.authservice.getBoutiqueByUserSession();
    return this.http.get<Annee[]>(`${this.apiUrl}/historique-caisse/annees/${boutiqueid}`);
  }
  getAllCaissier(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/annees`);
  }
  // Récupérer les mois par année
  getDateByAnnee(anneeId: number,vendeur:string): Observable<Date[]> {
     const boutiqueid=this.authservice.getBoutiqueByUserSession();
    const params = new HttpParams().set('anneeId', anneeId).set('boutiqueid',boutiqueid);
    return this.http.get<Date[]>(`${this.apiUrl}/dates/${vendeur}`, { params });
  }
 getAllDateCaisse(anneeId: number): Observable<Date[]> {
  
    //const params = new HttpParams().set('anneeId', anneeId);
     const boutiqueid=this.authservice.getBoutiqueByUserSession();
    return this.http.get<Date[]>(`${this.apiUrl}/all-dates/${anneeId}/${boutiqueid}`, );
  }

  // Récupérer les caissiers
  getCaissiers(): Observable<User[]> {
    const boutiqueid=this.authservice.getBoutiqueByUserSession();
    return this.http.get<User[]>(`${this.apiUrl}/allcaissier/${boutiqueid}`);
  }

  // Récupérer les dates pour la caisse
  getDatesCaisse(moisId: number): Observable<Date[]> {
    const boutiqueid=this.authservice.getBoutiqueByUserSession();
    const params = new HttpParams().set('moisId', moisId.toString()).set('boutiqueid',boutiqueid);
    return this.http.get<Date[]>(`${this.apiUrl}/dates`, { params });
  }

  // Récupérer l'historique par critères
  getHistoriqueVenteByDate(anneeId:number,vendeur:string,datevente:Date ): Observable<Vente[]> {
    const boutiqueid=this.authservice.getBoutiqueByUserSession();
    let params = new HttpParams();
    
    if (anneeId) {
      params = params.set('anneeId', anneeId);
    }
   
    if (vendeur) {
      params = params.set('vendeur', vendeur);
    }
     params = params.set('boutiqueid', boutiqueid);

    // Formatage explicite en yyyy-MM-dd - le backend (SimpleDateFormat) ne
    // garantit pas d'accepter un autre format, ne pas se fier a la
    // serialisation JSON par defaut d'un objet Date.
    const d = new Date(datevente);
    const anneeStr = d.getFullYear();
    const moisStr = String(d.getMonth() + 1).padStart(2, '0');
    const jourStr = String(d.getDate()).padStart(2, '0');
    const dateFormatee = `${anneeStr}-${moisStr}-${jourStr}`;

    return this.http.get<Vente[]>(`${this.apiUrl}/${dateFormatee}/historique`, { params });
  }

  // Récupérer le mode de paiement d'un ticket
  getModePaiement(numTicket: string): Observable<PaymentType> {
    const params = new HttpParams().set('numTicket', numTicket);
    return this.http.get<PaymentType>(`${this.apiUrl}/mode-paiement`, { params });
  }

  // Imprimer le détail
  printDetail(filter: CaisseFilter): Observable<Blob> {
    let params = new HttpParams();
    
    if (filter.annee?.id) {
      params = params.set('anneeId', filter.annee.id.toString());
    }
    if (filter.mois?.id) {
      params = params.set('moisId', filter.mois.id.toString());
    }
    if (filter.caissier?.id) {
      params = params.set('caissierId', filter.caissier.id.toString());
    }
    if (filter.date) {
      params = params.set('date', filter.date.toISOString());
    }

    return this.http.get(`${this.apiUrl}/print`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Méthodes utilitaires pour la gestion d'état
  updateDateByAnnee(date: Date[]): void {
    this.moisByAnneeSubject.next(date);
  }

  updateDatesCaisse(dates: Date[]): void {
    this.datesCaisseSubject.next(dates);
  }

  updateHistoriqueCaisse(historique: Vente): void {
    this.historiqueCaisseSubject.next(historique);
  }

  // Calculer le montant net encaissé
  calculMontantNetEncaisse(historique: Vente): number {
   /**  return historique.totalCaisse + 
           historique.totalTicketNonEnregistreEnCaisse + 
           historique.montantBonAchatEncaisserByCaisse + 
           historique.montantCodeMarchantMtn + 
           historique.montantCodeMarchantOrange - 
           historique.montantBonAchatSortieByCaisse;*/
           return 0;
  }

  // Obtenir le libellé du mois
  getMoisLibelle(typeMois: number): string {
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return mois[typeMois - 1] || '';
  }

  // Formater les nombres
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  // Formater les dates
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  getDates(vendeur: string, anneeId: number): Observable<Date[]> {
    const boutiqueid=this.authservice.getBoutiqueByUserSession();
    const params = new HttpParams().set('anneeId', anneeId).set('boutiqueid',boutiqueid);
 
    return this.http.get<Date[]>(
     
      `${this.apiUrl}/dates/${vendeur}`,
      { params }
    );
  }
}
