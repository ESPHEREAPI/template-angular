import { Injectable } from '@angular/core';
import { MargeVenteFilter } from '../model/marge-vente-filter';
import { BehaviorSubject, Observable } from 'rxjs';

import { Depot } from '../model/depot';
import { MargeVente } from '../model/marge-vente';
import { Annee } from '../model/annee';
import { MargeVenteStats } from '../model/marge-vente-stats';
import { map } from 'jquery';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MargeVenteServiceService {

  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  private margeVenteSubject = new BehaviorSubject<MargeVente[]>([]);
  private statsSubject = new BehaviorSubject<MargeVenteStats>({
    totalCaisse: 0,
    totalAchat: 0,
    remise: 0,
    totalMarge: 0
  });

  public margeVente$ = this.margeVenteSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Récupérer les marges de vente selon les filtres
  getMargesVente(filter: MargeVenteFilter): Observable<MargeVente[]> {
    let params = new HttpParams();

    if (filter.annee) {
      params = params.append('anneeId', filter.annee.id.toString());
    }
    //if (filter.mois) {
    //  params = params.append('moisId', filter.mois.id.toString());
    //}
    if (filter.date) {
      params = params.append('date', filter.date.toISOString());
    }
    if (filter.depot?.id) {
      params = params.append('depotId', filter.depot.id.toString());
    }
    params = params.append('position', filter.position.toString());

    return this.http.get<MargeVente[]>(`${this.apiUrl}/list`, { params });
    /**  .pipe(
       map(marges => {
         this.margeVenteSubject.next(marges);
         this.calculerStats(marges);
         return marges;
       })
     );**/
  }

  // Calculer les statistiques
  private calculerStats(marges: MargeVente[]): void {
    const stats: MargeVenteStats = {
      totalCaisse: marges.reduce((sum, m) => sum + m.montant, 0),
      totalAchat: marges.reduce((sum, m) => sum + m.montanAchat, 0),
      remise: marges.reduce((sum, m) => sum + (m.montant - m.prixVente * m.quantite), 0),
      totalMarge: marges.reduce((sum, m) => sum + m.marge, 0)
    };
    this.statsSubject.next(stats);
  }

  // Récupérer toutes les années
  /** getAnnees(): Observable<Annee[]> {
     return this.http.get<Annee[]>(`${this.apiUrl}/annees`);
   }**/
  // Récupérer toutes les années
  getAnnees(): Observable<Annee[]> {
    return this.http.get<Annee[]>(`${this.apiUrl}/annees`);
  }

  // Récupérer les mois par année
  getDateByAnnee(anneeId: number): Observable<Date[]> {
    const boutiqueid = this.authService.getBoutiqueByUserSession();
    return this.http.get<Date[]>(`${this.apiUrl}/all-dates/${anneeId}/${boutiqueid}`);
  }

  // Récupérer les dates par mois
  // getDatesByMois(moisId: number): Observable<Date[]> {
  // return this.http.get<string[]>(`${this.apiUrl}/dates/${moisId}`)
  //  .pipe(
  //  map(dates => dates.map(d => new Date(d)))
  //);
  //}

  // Récupérer tous les dépôts
  getDepots(): Observable<Depot[]> {
    return this.http.get<Depot[]>(`${this.apiUrl}/depots-boutique`);
  }

  // Valider un achat
  validerAchat(margeVente: MargeVente): Observable<MargeVente> {
    return this.http.put<MargeVente>(`${this.apiUrl}/valider`, margeVente);
  }

  // Générer un rapport
  genererRapport(filter: MargeVenteFilter): Observable<Blob> {
    let params = new HttpParams();

    if (filter.annee) {
      params = params.append('anneeId', filter.annee.id.toString());
    }
    // if (filter.mois) {
    //params = params.append('moisId', filter.mois.id.toString());
    // }
    if (filter.date) {
      params = params.append('date', filter.date.toISOString());
    }
    if (filter.depot?.id) {
      params = params.append('depotId', filter.depot.id.toString());
    }
    params = params.append('position', filter.position.toString());

    return this.http.get(`${this.apiUrl}/rapport`, {
      params,
      responseType: 'blob'
    });
  }

  // Utilitaire pour formater les nombres
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  // Utilitaire pour formater les dates
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR').format(date);
  }

  // Obtenir le nom du mois
  getMoisName(typeMois: number): string {
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return mois[typeMois - 1] || '';
  }
  getMargeJournaliere(date: Date, anneeid: number): Observable<MargeVente[]> {
    let params = new HttpParams();

    if (anneeid) {
      params = params.append('anneeId', anneeid);
    }
    // if (filter.mois) {
    //params = params.append('moisId', filter.mois.id.toString());
    // }
    if (date) {
      params = params.append('dateVente', ""+date);
    }
    return this.http.get<MargeVente[]>(`${this.apiUrl}/marge-journalier`, { params });
  }

   getMargeMargeMensuel(debut: Date,fin:Date, anneeid: number): Observable<MargeVente[]> {
    let params = new HttpParams();

    if (anneeid) {
      params = params.append('anneeId', anneeid);
    }
    // if (filter.mois) {
    //params = params.append('moisId', filter.mois.id.toString());
    // }
    if (debut) {
      params = params.append('debut', ""+debut);
    }
     if (fin) {
      params = params.append('fin', ""+fin);
    }
    return this.http.get<MargeVente[]>(`${this.apiUrl}/marge-mensuel`, {params});
  }
}
