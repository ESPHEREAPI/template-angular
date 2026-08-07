import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vente } from '../model/vente';
import { environment } from '../../../environments/environment';
import { Page } from '../model/page';
import { User } from '../model/user';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ControleCaisseService {
  private readonly baseUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  
  constructor(private http: HttpClient, private authService: AuthService) {}

  getVentes(
    page: number, 
    size: number, 
    statut?: string, 
    dateDebut?: Date, 
    dateFin?: Date
  ): Observable<Page<Vente>> {
    const boutiqueid = this.authService.getBoutiqueByUserSession();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('boutiqueid', boutiqueid.toString());
    
    // ✅ N'ajouter les paramètres que s'ils sont définis et non vides
    if (statut && statut.trim() !== '') {
      params = params.set('statut', statut);
    }
    
    // ✅ Vérifier que dateDebut est bien une Date valide
    if (dateDebut && dateDebut instanceof Date && !isNaN(dateDebut.getTime())) {
      params = params.set('dateDebut', this.formatDateTime(dateDebut));
    }
    
    // ✅ Vérifier que dateFin est bien une Date valide
    if (dateFin && dateFin instanceof Date && !isNaN(dateFin.getTime())) {
      // Ajuster à la fin de la journée (23:59:59)
      const endOfDay = new Date(dateFin);
      endOfDay.setHours(23, 59, 59, 999);
      params = params.set('dateFin', this.formatDateTime(endOfDay));
    }

    return this.http.get<Page<Vente>>(this.baseUrl, { params });
  }

  updateStatut(venteId: number, username: string, statut: string): Observable<Vente> {
    const boutiqueid = this.authService.getBoutiqueByUserSession();
    return this.http.patch<Vente>(
      `${this.baseUrl}/${venteId}/${username}/statut/${boutiqueid}`, 
      { statut }
    );
  }

  getVente(id: number): Observable<Vente> {
    return this.http.get<Vente>(`${this.baseUrl}/${id}`);
  }

  getAllCaissier(): Observable<User[]> {
    const boutiqueid = this.authService.getBoutiqueByUserSession();
    return this.http.get<User[]>(`${this.baseUrl}/allcaissier/${boutiqueid}`);
  }

  /**
   * Formate une date au format ISO 8601 : yyyy-MM-dd'T'HH:mm:ss
   * Compatible avec @DateTimeFormat du backend Spring
   */
  private formatDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}