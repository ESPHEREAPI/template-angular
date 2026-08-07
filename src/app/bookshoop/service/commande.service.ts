import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Commande } from '../model/commande';
import { ApiResponse } from '../model/api-response';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommandeService {

private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  private commandesSubject = new BehaviorSubject<Commande[]>([]);
  public commandes$ = this.commandesSubject.asObservable();

  constructor(private http: HttpClient,private autheService: AuthService) {}

  private getBoutiqueUser(): number {
    const user = this.autheService.getUserFromStorage();
    let boutiqueid = 0;
    if (user) {

      let boutiqueid = user.usersDTO.boutiqueid ?? 0;

    }
    return boutiqueid;
  }

  // Gestion des commandes
  getCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/commandes`);
  }

  createCommande(commande: Commande): Observable<ApiResponse<Commande>> {
    return this.http.post<ApiResponse<Commande>>(`${this.apiUrl}/commandes`, commande);
  }

  updateCommande(id: number, commande: Commande): Observable<ApiResponse<Commande>> {
    return this.http.put<ApiResponse<Commande>>(`${this.apiUrl}/commandes/${id}`, commande);
  }

  deleteCommande(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/commandes/${id}`);
  }

  // Approvisionnement
  approvisionnementProduit(commandes: Commande[],username:string): Observable<ApiResponse<void>> {
    const commande=commandes[0];
    console.log("commande");
    console.log(commande);
    console.log("username.."+username);
    commande.usercreate=username;
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/approvisionner`, commande);
  }

  // Mise à jour du state localh
  updateLocalCommandes(commandes: Commande[]): void {
    this.commandesSubject.next(commandes);
  }

  addLocalCommande(commande: Commande): void {
    const current = this.commandesSubject.value;
    this.commandesSubject.next([...current, commande]);
  }

  removeLocalCommande(index: number): void {
    const current = this.commandesSubject.value;
    current.splice(index, 1);
    this.commandesSubject.next([...current]);
  }
}