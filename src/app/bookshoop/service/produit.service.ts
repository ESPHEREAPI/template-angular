import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { Produit } from '../model/produit';
import { ApiResponse } from '../model/api-response';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private readonly apiUrl = `${environment.apiUrl}/gateway-proxy/api/microservice-produits`;

  // 🔥 STATE MANAGEMENT - Gestion réactive de la liste des produits
  private produitsSubject = new BehaviorSubject<Produit[]>([]);
  public produits$ = this.produitsSubject.asObservable();
  
  // 🔥 Cache pour éviter les rechargements inutiles
  private produitsLoaded = false;

  constructor(private http: HttpClient,private authService:AuthService) {}

  // ==================== GESTION DE LA LISTE DES PRODUITS ====================

  /**
   * Récupère tous les produits
   */
  getProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/produits`);
  }

   getProduitsHaveStock(anneeid:number,boutiqueid:number): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/factures/produits/have-stock/${anneeid}/${boutiqueid}`);
  }


  /**
   * ✅ MÉTHODE OPTIMISÉE - Récupère les produits pour l'autocomplétion avec gestion d'état
   * @param forceReload Force le rechargement même si les données sont déjà en cache
   */
  getProduitsAutoComplet(forceReload: boolean = false): Observable<Produit[]> {
    console.log("🔄 Appel de l'API getProduitsAutoComplet - forceReload:", forceReload);

    // Si déjà chargé et pas de forceReload, retourner le cache via Observable
    if (this.produitsLoaded && !forceReload) {
      console.log("📦 Utilisation du cache - Produits déjà chargés:", this.produitsSubject.value.length);
      return this.produits$;
    }

    // Charger depuis l'API et mettre à jour l'état
    const boutiqueid=this.authService.getBoutiqueByUserSession();
    return this.http.get<Produit[]>(`${this.apiUrl}/top/${boutiqueid}`).pipe(
      tap(produits => {
        console.log("✅ Produits chargés depuis l'API:", produits.length);
        this.produitsSubject.next(produits);
        this.produitsLoaded = true;
      }),
      catchError(error => {
        console.error("❌ Erreur lors du chargement des produits:", error);
        return of([]);
      })
    );
  }

  /**
   * Récupère un produit par référence
   */
  getProduitByReference(reference: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/produits/reference/${reference}`);
  }

  /**
   * Vérifie si une référence existe déjà
   */
  checkReferenceExists(reference: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/${reference}`).pipe(
      catchError(() => of(false))
    );
  }

  /**
   * Récupère un produit par ID
   */
  getProduitByProduitId(produitid: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/produits/id/${produitid}`);
  }

  /**
   * Récupère un produit par code-barres
   */
  getProduitByBarcode(barcode: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/produits/barcode/${barcode}`);
  }

  // ==================== CRÉATION ET MODIFICATION ====================

  /**
   * ✅ MÉTHODE OPTIMISÉE - Crée un produit et met à jour automatiquement la liste
   */
// ✅ MÉTHODE CORRIGÉE avec vérifications
createProduit(produit: Produit): Observable<ApiResponse<Produit>> {
  console.log("🆕 Création d'un nouveau produit:", produit.libelle);
  
  return this.http.post<ApiResponse<Produit>>(`${this.apiUrl}/articles`, produit).pipe(
    tap(response => {
      // ✅ Vérifications multiples
      if (!response) {
        console.error("❌ Réponse vide de l'API");
        return;
      }

      if (!response.data) {
        console.error("❌ response.data est undefined");
        return;
      }

      console.log("✅ Produit créé avec succès - ID:", response.data.id);
      
      // ✅ Récupérer la liste actuelle
      const currentProduits = this.produitsSubject.value;
      console.log("📊 Produits actuels:", currentProduits.length);
      
      // ✅ Vérifier si le produit existe déjà (avec vérification de l'ID)
      const exists = response.data.id 
        ? currentProduits.some(p => p?.id === response.data.id)
        : false;
        
      console.log("🔍 Produit déjà dans la liste?", exists);
      
      if (!exists) {
        // ✅ Créer un NOUVEAU tableau avec le nouveau produit
        const updatedProduits = [...currentProduits, response.data];
        console.log("📋 Nouvelle liste:", updatedProduits.length);
        
        // ✅ Émettre la nouvelle liste
        this.produitsSubject.next(updatedProduits);
        
        // ✅ Vérifier que l'émission a fonctionné
        setTimeout(() => {
          const finalCount = this.produitsSubject.value.length;
          console.log("🔬 Vérification post-émission:", finalCount);
          
          if (finalCount !== updatedProduits.length) {
            console.error("❌ La liste n'a pas été mise à jour correctement!");
          }
        }, 100);
      }
    }),
    catchError(error => {
      console.error("❌ Erreur lors de la création du produit:", error);
      throw error;
    })
  );
}

  /**
   * Met à jour un produit existant
   */
  updateProduit(id: number, produit: Produit): Observable<ApiResponse<Produit>> {
    return this.http.put<ApiResponse<Produit>>(`${this.apiUrl}/produits/${id}`, produit).pipe(
      tap(response => {
        if (response.data) {
          // Mettre à jour le produit dans la liste
          const currentProduits = this.produitsSubject.value;
          const updatedProduits = currentProduits.map(p => 
            p.id === id ? response.data : p
          );
          this.produitsSubject.next(updatedProduits);
          console.log("✅ Produit mis à jour dans la liste");
        }
      })
    );
  }

  // ==================== GESTION DU STOCK ====================

  /**
   * Récupère le stock d'un produit
   */
  getStockByProduit(produitId: any, request: any): Observable<number> {
    return this.http.put<number>(`${this.apiUrl}/produits/${produitId}`, request);
  }

  /**
   * Récupère le stock d'un produit dans un dépôt
   */
  getStockByDepot(produitId: any, boutiqueid: any): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/produits/${produitId}/${boutiqueid}/depot`);
  }

  // ==================== GESTION DES PRIX ====================

  /**
   * Récupère les prix d'un produit (achat et vente)
   */
  getPrixProduit(produitId: number): Observable<{ prixAchat: number, prixVente: number }> {
    const url = `${this.apiUrl}/produits/${produitId}/prix`;
    return this.http.get<{ prixAchat: number, prixVente: number }>(url);
  }

  // ==================== MÉTHODES UTILITAIRES POUR LA GESTION D'ÉTAT ====================

  /**
   * ✅ Met à jour manuellement la liste des produits
   * Utile si vous chargez les produits d'une autre manière
   */
  updateProduitsList(produits: Produit[]): void {
    console.log("📋 Mise à jour manuelle de la liste:", produits.length);
    this.produitsSubject.next(produits);
    this.produitsLoaded = true;
  }

  /**
   * ✅ Ajoute un produit manuellement à la liste
   * Évite les doublons
   */
  addProduitToList(produit: Produit): void {
    const currentProduits = this.produitsSubject.value;
    
    // Vérifier si le produit n'existe pas déjà
    const exists = currentProduits.some(p => p.id === produit.id);
    
    if (!exists) {
      const updatedProduits = [...currentProduits, produit];
      this.produitsSubject.next(updatedProduits);
      console.log("➕ Produit ajouté manuellement à la liste:", produit.libelle);
    } else {
      console.log("⚠️ Le produit existe déjà dans la liste:", produit.libelle);
    }
  }

  /**
   * ✅ Supprime un produit de la liste
   */
  removeProduitFromList(produitId: number): void {
    const currentProduits = this.produitsSubject.value;
    const updatedProduits = currentProduits.filter(p => p.id !== produitId);
    this.produitsSubject.next(updatedProduits);
    console.log("➖ Produit supprimé de la liste - ID:", produitId);
  }

  /**
   * ✅ Réinitialise le cache
   * Force le prochain appel à getProduitsAutoComplet à recharger depuis l'API
   */
  clearCache(): void {
    this.produitsLoaded = false;
    console.log("🗑️ Cache réinitialisé");
  }

  /**
   * ✅ Récupère la liste actuelle des produits (valeur synchrone)
   */
  getCurrentProduits(): Produit[] {
    return this.produitsSubject.value;
  }

  /**
   * ✅ Vérifie si les produits sont chargés
   */
  isProduitsLoaded(): boolean {
    return this.produitsLoaded;
  }

  /**
   * ✅ Récupère le nombre de produits en cache
   */
  getProduitsCount(): number {
    return this.produitsSubject.value.length;
  }
}