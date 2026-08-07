import { Injectable } from '@angular/core';
import { CaisseItem } from '../model/caisse-item';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product } from '../../model/product';
import { PrixArticles } from '../model/prix-articles';
import { Ticket } from '../model/ticket';
import { PaymentType } from '../enums/payment-type';
import { BonAchat } from '../model/bon-achat';
import { Person } from '../model/person';
import { ApiResponse } from '../model/api-response';
import { Produit } from '../model/produit';
import { environment } from '../../../environments/environment';
import { Vente } from '../model/vente';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits`;
  
  // État du panier
  private cartItemsSubject = new BehaviorSubject<CaisseItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();
  
  private ticketNumberSubject = new BehaviorSubject<string>('');
  public ticketNumber$ = this.ticketNumberSubject.asObservable();

  constructor(private http: HttpClient,private autheService:AuthService) {}

  // Gestion des produits
  getProductByBarcode(barcode: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/barcode/${barcode}`);
  }

  getAllProducts(): Observable<PrixArticles[]> {
    return this.http.get<PrixArticles[]>(`${this.apiUrl}/products/prices`);

  }
getArticleById(produitid:number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/produit/${produitid}`);
  }
  searchProducts(query: string): Observable<PrixArticles[]> {
    return this.http.get<PrixArticles[]>(`${this.apiUrl}/products/search?q=${query}`);
  }

  // Gestion du panier
  addToCart(item: CaisseItem): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(
      cartItem => cartItem.article.id === item.article.id
    );

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantite += item.quantite;
      this.calculateItemAmount(currentItems[existingItemIndex]);
    } else {
      this.calculateItemAmount(item);
      currentItems.push(item);
    }
    
    this.cartItemsSubject.next([...currentItems]);
  }

  updateCartItemQuantity(itemId: number, quantity: number): void {
    const currentItems = this.cartItemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.article.id === itemId);
    
    if (itemIndex > -1) {
      currentItems[itemIndex].quantite = quantity;
      this.calculateItemAmount(currentItems[itemIndex]);
      this.cartItemsSubject.next([...currentItems]);
    }
  }

  updateCartItemPrice(itemId: number, price: number): void {
    const currentItems = this.cartItemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.article.id === itemId);
    
    if (itemIndex > -1) {
      currentItems[itemIndex].article.prixVenteTTC = price;
      this.calculateItemAmount(currentItems[itemIndex]);
      this.cartItemsSubject.next([...currentItems]);
    }
  }

  private calculateItemAmount(item: CaisseItem): void {
    item.montantTotal = item.quantite * item.article.prixVenteTTC;
  }

  getTotalAmount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + item.montantTotal, 0);
  }

  getChange(amountReceived: number): number {
    return amountReceived - this.getTotalAmount();
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    this.generateNewTicketNumber();
  }

  // Gestion des tickets
  generateNewTicketNumber(): void {
    const timestamp = Date.now();
    const ticketNum = `T${timestamp}`;
    this.ticketNumberSubject.next(ticketNum);
  }

  saveTicket(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/tickets`, ticket);
  }

  printTicket(ticketId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tickets/${ticketId}/print`, { 
      responseType: 'blob' 
    });
  }

  downloadTicket(ticketId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tickets/${ticketId}/download`, { 
      responseType: 'blob' 
    });
  }

  downloadTicketVente(venteid: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tickets/${venteid}/download`, { 
      responseType: 'blob' 
    });
  }
downloadTicketVenteTXT(venteid: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ticket/${venteid}/download-ticket`, { 
      responseType: 'blob' 
    });
  }

 
  // Gestion des paiements
  getPaymentTypes(): Observable<PaymentType[]> {
    return this.http.get<PaymentType[]>(`${this.apiUrl}/payment-types`);
  }

  validateBonAchat(code: string): Observable<BonAchat> {
    return this.http.get<BonAchat>(`${this.apiUrl}/bon-achat/validate/${code}`);
  }

  createBonAchat(bonAchat: BonAchat): Observable<BonAchat> {
    return this.http.post<BonAchat>(`${this.apiUrl}/bon-achat`, bonAchat);
  }

  // Gestion des clients
  getAllPersons(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.apiUrl}/all-client`);
  }

  createPerson(person: Person): Observable<Person> {
    return this.http.post<Person>(`${this.apiUrl}/create-client`, person);
  }

  // Utilitaires
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  convertAmountToWords(amount: number): string {
    // Implémentation de la conversion en lettres
    // Cette fonction devrait être adaptée selon vos besoins spécifiques
    return `${amount} francs`;
  }


  getArticleByBarcode(barcode: string): Observable<ApiResponse<Produit[]>> {
    const params = new HttpParams().set('barcode', barcode);
    return this.http.get<ApiResponse<Produit[]>>(`${this.apiUrl}/barcode`, { params });
  }

  getArticleByReference(reference: string): Observable<Produit> {
    const params = new HttpParams().set('reference', reference);
    return this.http.get<Produit>(`${this.apiUrl}/reference`, { params });
  }

  searchArticles(query: string): Observable<ApiResponse<Produit[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<Produit[]>>(`${this.apiUrl}/search`, { params });
  }

  getAllArticles(): Observable<ApiResponse<Produit[]>> {
    return this.http.get<ApiResponse<Produit[]>>(this.apiUrl);
  }

  autocompleteLibelle(query: string): Observable<string[]> {
    const params = new HttpParams().set('q', query);
     const boutiqueid=this.autheService.getBoutiqueByUserSession();
   //vente.boutiqueid=boutiqueid;
    return this.http.get<string[]>(`${this.apiUrl}/autocomplete/${boutiqueid}`, { params });

  }

   getProduitsAutoComplet(boutiqueid:number): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/top-articles/${boutiqueid}`);
  }

createVente(vente: Vente,numerocommande:number): Observable<number> {
  console.log(vente)
   const boutiqueid=this.autheService.getBoutiqueByUserSession();
   vente.boutiqueid=boutiqueid;
    return this.http.post<number>(`${this.apiUrl}/vente/${numerocommande}`, vente);
  }
 getStockcurrentProduit(productId:number): Observable<number> {
   const boutiqueid=this.autheService.getBoutiqueByUserSession();
    return this.http.get<number>(`${this.apiUrl}/current/${productId}/${boutiqueid}`);
  }
  verificationNumeTicket(numeTicket: string): Observable<Vente>{
    const boutiqueid=this.autheService.getBoutiqueByUserSession();
 return this.http.get<Vente>(`${this.apiUrl}/vente/${numeTicket}/${boutiqueid}`);
  }
 verificationNumeTicketForEcom(numeTicket: string): Observable<Vente>{
  console.log("valeur ticket ",numeTicket)
 return this.http.get<Vente>(`${this.apiUrl}/vente/e-com/${numeTicket}`);
  }
  createVenteForEcom(vente: Vente,numerocommande:number): Observable<number> {
  console.log(vente)
    const boutiqueid=this.autheService.getBoutiqueByUserSession();
   vente.boutiqueid=boutiqueid;
    return this.http.post<number>(`${this.apiUrl}/vente/e-com/${numerocommande}`, vente);
  }
}
