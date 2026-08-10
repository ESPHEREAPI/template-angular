import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { catchError, throwError, takeUntil, debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { Product } from '../../model/product';
import { ProductService } from '../../service/product.service';

import {  Router, RouterModule } from '@angular/router';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { CatalogueService } from '../../service/catalogue.service';
import { Catalogue } from '../../model/catalogues.models';
import { LoginService } from '../../service/login.service';
import { CaddyService } from '../../service/caddy.service';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { UserSession } from '../../../model/user-session';
import { ToastrService } from 'ngx-toastr';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';

declare var $: any; // Pour jQuery/AdminLTE

interface CartSummary {
  totalItems: number;
  totalAmount: number;
  items: Product[];
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ToastModule, MessagesModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  // Observables et données
  pruduct?: Observable<Array<Product>>;
  errorMessage!: string;
  isLoading = false;
  categories!: Array<Catalogue>;
  currentCategories!: Catalogue;

  // Configuration
  host: string = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com`;
  titre = 'Catalogue des Produits';

  // Gestion des photos
  currentProduct!: Product;
  editPhoto = false;
  progress = 0;
  file!: File;
  files!: File[];
  isUploading = false;
  timestamp = Date.now();
  profil!: string;

  // Panier et commandes
  cartItemsCount = 0;
  cartTotal = 0;
  showFloatingCart = true;

  // Recherche et filtres
  private searchSubject = new BehaviorSubject<string>('');
  private destroy$ = new Subject<void>();

  // Navigation
  url!: string;
  userSession!: UserSession;

  constructor(
    public producservice: ProductService,
   
    private router: Router,
    private catService: CatalogueService,
    public loginService: LoginService,
    private caddyService: CaddyService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private messageService: MessageService
  ) {
    this.initializeQuantities();
  }

  ngOnInit(): void {
    //this.router.navigate(['caddy']);
    this.setupRouterEvents();
    this.setupCartSubscription();
    this.setupSearchSubscription();
    this.loadInitialData();
    this.getCategorie();
    this.updateCartSummary();
    const rawUser = this.auth.getUserFromStorage();
    if (rawUser) {
      // Remap userDTO → usersDTO
      const userSession: UserSession = {
        usersDTO: rawUser.usersDTO, // 👈 remap ici
        token: rawUser.token,
        permissions: rawUser.permissions,
        expiresAt: new Date(rawUser.expiresAt),
      };
      this.userSession = userSession;

      const profil = this.userSession.usersDTO?.profil;
      if (profil) {
        console.log("profil =", profil.code);
        this.profil = profil.code;
      }

      // Initialize AdminLTE components
      setTimeout(() => {
        if (typeof $ !== 'undefined') {
          $('[data-card-widget="collapse"]').CardWidget('collapse');
        }
      }, 100);
    }
  }

  public isAdmin() {
    if (this.profil === 'CAISSIER') {
      return false;
    }
    return true;
  }

  private getCategorie() {
    this.catService.getResource("/produits/categories").subscribe({
      next: (data: Array<Catalogue>) => {
        console.log(data);
        this.categories = data;
      },
      error: err => {
        console.log(err);
      }
    })
  }

  listesProduitsByCategorie(cat: Catalogue) {
    this.currentCategories = cat
    this.isLoading = true;
    this.errorMessage = '';

    this.pruduct = this.producservice.getProduitByIdCategorie('/articles/categories/' + cat.id)
      .pipe(
        tap(products => {
          this.initializeProductQuantities(products);
          this.isLoading = false;
        }),
        catchError(err => {
          this.errorMessage = 'Erreur lors du chargement des produits';
          this.isLoading = false;
          console.error('Error loading products:', err);
          return throwError(err);
        })
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouterEvents(): void {
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        // Handle navigation events
        this.handleRouterNavigation(event);
      });
  }

  private setupCartSubscription(): void {
    // Vérifier périodiquement les changements du panier
    setInterval(() => {
      this.updateCartSummary();
    }, 1000); // Vérification toutes les secondes
  }

  private setupSearchSubscription(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  private handleRouterNavigation(event: any): void {
    // Simplified navigation logic
    if (event.url) {
      this.url = event.url;

      // Handle special routes
      const specialRoutes = ['/login', '/caddy', '/order', '/list-order'];
      if (specialRoutes.includes(this.url)) {
        this.router.navigateByUrl(this.url);
        return;
      }

      // Load products for main routes
      this.loadProducts();
    }
  }

  private loadInitialData(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.pruduct = this.producservice.getResource("/articles")
      .pipe(
        tap(products => {
          this.initializeProductQuantities(products);
          this.isLoading = false;
        }),
        catchError(err => {
          this.errorMessage = 'Erreur lors du chargement des produits';
          this.isLoading = false;
          console.error('Error loading products:', err);
          return throwError(err);
        })
      );
  }

  private initializeQuantities(): void {
    // Initialize default quantities for products
  }

  private initializeProductQuantities(products: Product[]): void {
    products.forEach(product => {
      if (!product.quantite_caddy) {
        product.quantite_caddy = 1;
      }
    });
  }

  // MÉTHODE CORRIGÉE - Gestion du panier
  onAddProductToCaddy(product: Product): void {
    console.log('Stock total:', product.quantite);
    console.log('Déjà dans panier AVANT:', this.getProductQuantityInCart(product.id));
    console.log('Quantité à ajouter:', product.quantite_caddy);
    
    if (!product.quantite_caddy || product.quantite_caddy <= 0) {
      this.messageService.add({ severity: 'error', summary: 'ERREUR', detail: 'Quantité invalide ou produit indisponible' });
      return;
    }

    if (product.quantite_caddy > product.quantite) {
      this.messageService.add({ severity: 'error', summary: 'ERREUR', detail: 'Quantité demandée supérieure au stock disponible' });
      return;
    }

    try {
      // Vérifier si le produit existe déjà dans le panier
      const existingProduct = this.caddyService.findProductInCart(product.id);
   console.log("le produit existe :" ,existingProduct)
      if (existingProduct) {
        // Le produit existe déjà, on met à jour la quantité
        console.log("le produit existe :" ,existingProduct)
        const newQuantity = existingProduct.quantite + product.quantite_caddy;
        console.log("newQuantity :" ,newQuantity)

        // Vérifier que la nouvelle quantité ne dépasse pas le stock
        if (newQuantity > product.quantite) {
                  console.log("newQuantity :" ,newQuantity > product.quantite)
          this.messageService.add({
            severity: 'warning',
            summary: 'ATTENTION',
            detail: `Quantité maximum disponible: ${product.quantite - existingProduct.product.quantite_caddy}. Stock insuffisant.`
          });
          return;
        }

        // Mettre à jour la quantité du produit existant
        console.log("Mettre à jour la quantité du produit existant :" ,existingProduct)
        this.caddyService.updateProductQuantityInCart(product.id, newQuantity);

        this.messageService.add({
          severity: 'success',
          summary: 'Quantité mise à jour',
          detail: `${product.libelle} - Quantité mise à jour: ${newQuantity} unité(s)`
        });
      } else {
        // Le produit n'existe pas dans le panier, on l'ajoute normalement
        this.caddyService.addProductTocaddy(product);

        this.messageService.add({
          severity: 'success',
          summary: 'Ajout réussi',
          detail: `${product.libelle} ajouté au panier (${product.quantite_caddy} unité(s))`
        });
      }

      // IMPORTANT: Forcer la mise à jour immédiate
      this.updateCartSummary();
      this.cdr.detectChanges();

      // Reset quantity to 1 after adding
      product.quantite_caddy = 1;
      
      // Vérification après ajout
      console.log('Déjà dans panier APRÈS:', this.getProductQuantityInCart(product.id));
      
      // Debug complet
      //this.debugCartState(product.id);

    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'ERREUR', detail: 'Erreur lors de l\'ajout au panier' });
      console.error('Error adding to cart:', error);
    }
  }

  // MÉTHODES POUR LE PANIER - CORRIGÉES
  isProductInCart(productId: number): boolean {
    try {
      const exists = this.caddyService.findProductInCart(productId) !== null;
      return exists;
    } catch (error) {
      console.error('Error checking if product is in cart:', error);
      return false;
    }
  }

  getProductQuantityInCart(productId: number): number {
    try {
      const existingProduct = this.caddyService.findProductInCart(productId);
      const quantity = existingProduct ? existingProduct.quantite : 0;
      return quantity;
    } catch (error) {
      console.error('Error getting product quantity from cart:', error);
      return 0;
    }
  }

  // MÉTHODES POUR LA LOGIQUE DU BOUTON - NOUVELLES
  isButtonDisabled(product: Product): boolean {
    const inCartQuantity = this.getProductQuantityInCart(product.id);
    const stock = product.quantite || 0;
    const toAdd = product.quantite_caddy || 0;

    const disabled = (
      stock <= 0 ||
      toAdd <= 0 ||
      (toAdd + inCartQuantity) > stock ||
      inCartQuantity >= stock
    );

  /**   console.log(`[DEBUG] Product ${product.id} - Button disabled:`, {
      stock,
      inCartQuantity,
      toAdd,
      disabled,
      reason: disabled ? (
        stock <= 0 ? 'No stock' :
        toAdd <= 0 ? 'Invalid quantity' :
        (toAdd + inCartQuantity) > stock ? 'Exceeds stock' :
        inCartQuantity >= stock ? 'Cart at max' : 'Unknown'
      ) : 'Enabled'
    });*/

    return disabled;
  }

  getButtonText(product: Product): string {
    const inCartQuantity = this.getProductQuantityInCart(product.id);
    const stock = product.quantite || 0;

    if (stock <= 0) {
      return 'Produit indisponible';
    }

    if (inCartQuantity >= stock) {
      return 'Stock épuisé';
    }

    if (this.isProductInCart(product.id)) {
      return 'Ajouter plus';
    }

    return 'Ajouter au panier';
  }

  // MÉTHODE DE DEBUG - TEMPORAIRE
  debugCartState(productId: number): void {
    console.log('=== DEBUG CART STATE ===');
    console.log('Product ID:', productId);
    
    try {
      const cartSummary = this.caddyService.getCartSummary();
      console.log('Cart Summary:', cartSummary);
      
      const productInCart = this.caddyService.findProductInCart(productId);
      console.log('Product in cart:', productInCart);
      
      const quantity = this.getProductQuantityInCart(productId);
      console.log('Quantity from method:', quantity);
      
      const isInCart = this.isProductInCart(productId);
      console.log('Is in cart:', isInCart);
      
    } catch (error) {
      console.error('Debug error:', error);
    }
    console.log('=========================');
  }

  // Retirer un produit du panier
  removeProductFromCart(product: Product): void {
    try {
      this.caddyService.removeProductFromCart(product.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Produit retiré',
        detail: `${product.libelle} retiré du panier`
      });

      // Forcer la mise à jour immédiate
      this.updateCartSummary();
      this.cdr.detectChanges();

    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'ERREUR', detail: 'Erreur lors de la suppression' });
      console.error('Error removing from cart:', error);
    }
  }

  increaseQuantity(product: Product): void {
    const maxAvailable = product.quantite - this.getProductQuantityInCart(product.id);
    if (product.quantite_caddy < maxAvailable) {
      product.quantite_caddy++;
    }
  }

  decreaseQuantity(product: Product): void {
    if (product.quantite_caddy > 1) {
      product.quantite_caddy--;
    }
  }

  validateQuantity(product: Product): void {
    const maxAvailable = product.quantite - this.getProductQuantityInCart(product.id);
    
    if (!product.quantite_caddy || product.quantite_caddy < 1) {
      product.quantite_caddy = 1;
    } else if (product.quantite_caddy > maxAvailable) {
      product.quantite_caddy = maxAvailable;
      this.messageService.add({ 
        severity: 'warning', 
        summary: 'ATTENTION', 
        detail: 'Quantité ajustée selon le stock disponible' 
      });
    }
  }

  private updateCartSummary(): void {
    const summary = this.caddyService.getCartSummary();
    this.cartItemsCount = summary.itemsCount;
    this.cartTotal = summary.total;
    
    // Force la détection des changements
    this.cdr.detectChanges();
  }

  viewCart(): void {
    //console.log("Navigation vers /caddy...");
    window.location.href = '/caddy';
    //this.router.navigateByUrl("caddy");
   //this.router.navigate(['caddy']);

  /**this.router.navigateByUrl('/caddy').then(success => {
    if (success) {
      console.log('Navigation réussie vers /caddy');
    } else {
      console.warn('Navigation vers /caddy a échoué');
    }
  }).catch(err => {
    console.error('Erreur lors de la navigation:', err);
  });**/
}

  quickCheckout(): void {
    if (this.cartItemsCount === 0) {
      this.messageService.add({ severity: 'warning', summary: 'ATTENTION', detail: 'Votre panier est vide' });
      return;
    }
    window.location.href = '/order';
    //this.router.navigateByUrl("/order")
     console.log('viewCart appelée');
  this.router.navigateByUrl('/order').then(success => {
    if (!success) {
      console.warn('Navigation vers /order a échoué');
    }
  }).catch(err => console.error('Erreur navigation:', err));
  
  }

  toggleFloatingCart(): void {
    this.showFloatingCart = !this.showFloatingCart;
  }

  // Gestion de la recherche
  searchProduct(dataForm: any): void {
    const keyword = dataForm.rechercheHeader?.trim();
    this.searchSubject.next(keyword || '');
  }

  private performSearch(keyword: string): void {
    if (keyword) {
      this.isLoading = true;
      this.titre = `Résultats de recherche pour: "${keyword}"`;

      this.pruduct = this.producservice.searchProducts(keyword, 0)
        .pipe(
          tap(products => {
            this.initializeProductQuantities(products);
            this.isLoading = false;
          }),
          catchError(err => {
            this.errorMessage = 'Erreur lors de la recherche';
            this.isLoading = false;
            console.error('Search error:', err);
            return throwError(err);
          })
        );
    } else {
      this.titre = 'Tous les Produits';
      this.loadProducts();
    }
  }

  // Gestion des photos (Admin)
  onEditPhoto(product: Product): void {
    if (this.profil === 'CAISSIER') {
      return;
    }

    this.currentProduct = product;
    this.editPhoto = true;
    this.progress = 0;
  }

  onCloseEditPhoto(): void {
    this.editPhoto = false;
    this.currentProduct = null!;
    this.progress = 0;
    this.files = null!;
  }

  onSelectedFile(event: any): void {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      this.files = selectedFiles;

      // Validate file type and size
      const file = selectedFiles[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (!allowedTypes.includes(file.type)) {
        this.messageService.add({ severity: 'warning', summary: 'ERREUR', detail: 'Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.' });
        return;
      }

      if (file.size > maxSize) {
        this.messageService.add({ severity: 'warning', summary: 'ERREUR', detail: 'Fichier trop volumineux. Maximum 5MB.' });
        return;
      }
    }
  }

  upload(): void {
    if (!this.files?.length || !this.currentProduct) {
      this.messageService.add({ severity: 'warning', summary: 'ERREUR', detail: 'Veuillez sélectionner un fichier.' });
      return;
    }

    this.progress = 0;
    this.isUploading = true;
    this.file = this.files[0];

    this.producservice.uploadPhotoProduct(this.file, this.currentProduct.id)
      .subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progress = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            this.messageService.add({ severity: 'success', summary: 'SUCCÈS', detail: 'Photo mise à jour avec succès' });
            this.timestamp = Date.now();
            this.onCloseEditPhoto();
          }
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.messageService.add({ severity: 'error', summary: 'ERREUR', detail: 'Erreur lors du téléchargement' });
          this.isUploading = false;
        },
        complete: () => {
          this.isUploading = false;
        }
      });
  }

  // Utilitaires
  getProductImageUrl(productId: number): string {
    return `${this.host}/articles/photos/${productId}?ts=${this.timestamp}`;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/no-image.png'; // Image par défaut
  }

  getTS(): number {
    return this.timestamp;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  private showNotification(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): void {
    console.log(`[${type.toUpperCase()}]: ${message}`);

    if (typeof $ !== 'undefined') {
      const alertClass = type === 'success' ? 'alert-success' :
        type === 'warning' ? 'alert-warning' :
          'alert-danger';

      const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>
      `;

      $('.content-wrapper').prepend(alertHtml);

      setTimeout(() => {
        $('.alert').fadeOut();
      }, 5000);
    }
  }

  // Méthodes de cycle de vie des commandes
  createNewOrder(): void {
    if (this.cartItemsCount === 0) {
      this.showNotification('Votre panier est vide', 'warning');
      return;
    }

    try {
      const order = this.caddyService.saveCurrentOrderAndClearCart();
      this.showNotification(`Commande ${order.id} sauvegardée avec succès!`, 'success');
      this.updateCartSummary();

      this.router.navigate(['/order'], {
        queryParams: { orderId: order.id }
      });
    } catch (error) {
      this.showNotification('Erreur lors de la sauvegarde de la commande', 'error');
      console.error('Error creating new order:', error);
    }
  }

  continueShoppingAfterOrder(): void {
    this.updateCartSummary();
    this.loadProducts();
    this.showNotification('Vous pouvez maintenant passer une nouvelle commande', 'success');
  }

  viewOrderHistory(): void {
    this.router.navigate(['/list-order']);
  }

  getPendingOrdersCount(): number {
    return this.caddyService.getPendingOrdersCount();
  }

  // Gestion des favoris (optionnel)
  toggleFavorite(product: Product): void {
    console.log('Toggle favorite for:', product.libelle);
  }

  // Comparaison de produits (optionnel)
  addToCompare(product: Product): void {
    console.log('Add to compare:', product.libelle);
  }

  // Nouvelle méthode pour forcer la mise à jour de l'affichage
  forceUpdateView(): void {
    this.updateCartSummary();
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}