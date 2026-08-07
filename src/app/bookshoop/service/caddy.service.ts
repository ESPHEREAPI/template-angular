import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Caddy } from '../model/Caddy';
import { Product } from '../model/product';
import { ItemProduct } from '../model/Item-Product';

export interface OrderSummary {
  id: string;
  items: ItemProduct[];
  total: number;
  itemCount: number;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customerInfo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CaddyService {
  currentCaddyName: string = "caddy1";
  private caddie!: Caddy;
  // Vos propriétés existantes...
 //private caddy: Product[] = [];

  // Ajout de la réactivité pour les mises à jour du panier
  private cartSubject = new BehaviorSubject<Caddy | null>(null);
  public cartUpdated$ = this.cartSubject.asObservable();

  // Gestion des commandes multiples
  private readonly ORDERS_STORAGE_KEY = 'customer_orders';
  private readonly CART_HISTORY_KEY = 'cart_history';

  constructor() {
    this.initializeCaddy();
    this.emitCartUpdate();
  }

  private initializeCaddy(): void {
    let caddy = localStorage.getItem("caddy");
    if (caddy) {
      try {
        this.caddie = JSON.parse(caddy);
        // Vérifier la structure du caddy
        if (!this.caddie.itemsProducts) {
          this.caddie.itemsProducts = [];
        }
      } catch (error) {
        console.error('Error parsing caddy from localStorage:', error);
        this.caddie = new Caddy(this.currentCaddyName);
      }
    } else {
      this.caddie = new Caddy(this.currentCaddyName);
      if (!this.caddie.itemsProducts) {
        this.caddie.itemsProducts = [];
      }
    }
  }

  private emitCartUpdate(): void {
    // Émettre les changements du panier pour la réactivité
    this.cartSubject.next(this.caddie);
  }

  public saveCaddy(): void {
    try {
      console.log("caddy",this.caddie )
      if(!this.caddie)  console.error('Error saving caddy to localStorage:');
      localStorage.setItem("caddy", JSON.stringify(this.caddie));
      this.emitCartUpdate();
    } catch (error) {
      console.error('Error saving caddy to localStorage:', error);
    }
  }

  

 public addProductTocaddy(product: Product): void {
  if (!product || !product.quantite_caddy || product.quantite_caddy <= 0) {
    alert('Produit ou quantité invalide');
    return;
  }

  // Vérifier le stock disponible
  if (product.quantite_caddy > product.quantite) {
    alert('Quantité demandée supérieure au stock disponible');
    return;
  }

  let existe_product = false;

  if (this.caddie) {
    let productItem = this.caddie.itemsProducts || [];

    // Utiliser une boucle for...of pour pouvoir quitter la fonction
    for (const ip of productItem) {
      if (ip.product.id === product.id) {
        const newQuantity = ip.quantite + product.quantite_caddy;

        if (newQuantity > product.quantite) {
          alert(`Stock insuffisant. Stock disponible: ${product.quantite}, quantité actuelle dans le panier: ${ip.quantite}`);
          return; // quitte toute la fonction
        }

        ip.quantite = newQuantity;
        existe_product = true;
        break; // on sort de la boucle, pas besoin de continuer
      }
    }

    if (!existe_product) {
      let prodItem = new ItemProduct();
      prodItem.price = product.prixUnitaire;
      prodItem.quantite = product.quantite_caddy;
      prodItem.product = product;
      productItem.push(prodItem);
    }

    this.caddie.itemsProducts = productItem;
    this.saveCaddy();
  }
}


  // Méthode pour mettre à jour la quantité d'un produit
  public updateProductQuantity(productId: number, newQuantity: number): void {
    if (!this.caddie.itemsProducts) return;

    const itemIndex = this.caddie.itemsProducts.findIndex(ip => ip.product.id === productId);

    if (itemIndex >= 0) {
      const item = this.caddie.itemsProducts[itemIndex];

      if (newQuantity <= 0) {
        // Supprimer l'item si la quantité est 0 ou négative
        this.caddie.itemsProducts.splice(itemIndex, 1);
      } else if (newQuantity > item.product.quantite) {
        throw new Error('Quantité demandée supérieure au stock disponible');
      } else {
        item.quantite = newQuantity;
      }

      this.saveCaddy();
    }
  }

  public getCurrentcaddy(): Caddy {
    return this.caddie;
  }

  public getSizeCaddy(): number {
    if (!this.caddie) {
      this.initializeCaddy();
    }

    let caddy: Array<ItemProduct> = this.caddie.itemsProducts;
    if (caddy) {
      return caddy.length;
    }
    return 0;
  }

  public getItemsCount(): number {
    if (!this.caddie.itemsProducts) return 0;

    return this.caddie.itemsProducts.reduce((total, item) => total + item.quantite, 0);
  }

  public getTotal(): number {
    let total: number = 0;
    if (this.caddie.itemsProducts) {
      this.caddie.itemsProducts.forEach(ip =>
        total += ip.price * ip.quantite
      );
    }
    return total;
  }

  public deleteCaddy(ip: ItemProduct): void {
    if (!this.caddie.itemsProducts) return;

    let index = this.caddie.itemsProducts.indexOf(ip);
    if (index >= 0) {
      this.caddie.itemsProducts.splice(index, 1);
      this.saveCaddy();
    }
  }

  public clearCaddy(): void {
    this.caddie.itemsProducts = [];
    this.saveCaddy();
  }

  // Nouvelles méthodes pour les commandes multiples
  public saveCurrentOrderAndClearCart(customerInfo?: any): OrderSummary {
    if (!this.caddie.itemsProducts || this.caddie.itemsProducts.length === 0) {
      throw new Error('Le panier est vide');
    }

    const order: OrderSummary = {
      id: this.generateOrderId(),
      items: [...this.caddie.itemsProducts], // Copie profonde
      total: this.getTotal(),
      itemCount: this.getItemsCount(),
      createdAt: new Date(),
      status: 'pending',
      customerInfo: customerInfo
    };

    // Sauvegarder la commande
    this.saveOrder(order);

    // Sauvegarder dans l'historique
    this.saveToCartHistory(order);

    // Vider le panier pour permettre une nouvelle commande
    this.clearCaddy();

    return order;
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  private saveOrder(order: OrderSummary): void {
    try {
      const existingOrders = this.getAllOrders();
      existingOrders.push(order);
      localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(existingOrders));
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  public getAllOrders(): OrderSummary[] {
    try {
      const orders = localStorage.getItem(this.ORDERS_STORAGE_KEY);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  public getOrderById(orderId: string): OrderSummary | null {
    const orders = this.getAllOrders();
    return orders.find(order => order.id === orderId) || null;
  }

  public updateOrderStatus(orderId: string, status: OrderSummary['status']): void {
    const orders = this.getAllOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex >= 0) {
      orders[orderIndex].status = status;
      localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }

  public getPendingOrdersCount(): number {
    return this.getAllOrders().filter(order => order.status === 'pending').length;
  }

  public getTotalOrdersValue(): number {
    return this.getAllOrders().reduce((total, order) => total + order.total, 0);
  }

  private saveToCartHistory(order: OrderSummary): void {
    try {
      const history = this.getCartHistory();
      history.push({
        ...order,
        savedAt: new Date()
      });

      // Garder seulement les 50 dernières commandes dans l'historique
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      localStorage.setItem(this.CART_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving to cart history:', error);
    }
  }

  public getCartHistory(): any[] {
    try {
      const history = localStorage.getItem(this.CART_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading cart history:', error);
      return [];
    }
  }

  public restoreCartFromHistory(historyItem: any): void {
    try {
      this.clearCaddy();

      if (historyItem.items && Array.isArray(historyItem.items)) {
        historyItem.items.forEach((item: ItemProduct) => {
          // Vérifier que le produit est encore disponible
          if (item.product && item.quantite > 0) {
            const product = { ...item.product };
            product.quantite_caddy = item.quantite;

            try {
              this.addProductTocaddy(product);
            } catch (error) {
              console.warn(`Impossible de restaurer le produit ${product.libelle}:`, error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error restoring cart from history:', error);
    }
  }

  // Méthodes utilitaires
  public isProductInCart(productId: number): boolean {
    if (!this.caddie.itemsProducts) return false;
    return this.caddie.itemsProducts.some(item => item.product.id === productId);
  }

  public getProductQuantityInCart(productId: number): number {
    if (!this.caddie.itemsProducts) return 0;

    const item = this.caddie.itemsProducts.find(item => item.product.id === productId);
    return item ? item.quantite : 0;
  }

  public getCartSummary(): { itemsCount: number; total: number; items: ItemProduct[] } {
    return {
      itemsCount: this.getItemsCount(),
      total: this.getTotal(),
      items: this.caddie.itemsProducts || []
    };
  }

  // Méthodes pour la persistance et la récupération
  public exportCart(): string {
    return JSON.stringify(this.caddie);
  }

  public importCart(cartData: string): boolean {
    try {
      const importedCaddy = JSON.parse(cartData);

      // Validation basique
      if (importedCaddy && typeof importedCaddy === 'object') {
        this.caddie = importedCaddy;
        if (!this.caddie.itemsProducts) {
          this.caddie.itemsProducts = [];
        }
        this.saveCaddy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing cart:', error);
      return false;
    }
  }

  // Nettoyage des données anciennes
  public cleanupOldData(daysToKeep: number = 30): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Nettoyer l'historique
      const history = this.getCartHistory();
      const filteredHistory = history.filter(item =>
        new Date(item.savedAt) > cutoffDate
      );
      localStorage.setItem(this.CART_HISTORY_KEY, JSON.stringify(filteredHistory));

      // Nettoyer les anciennes commandes (optionnel)
      const orders = this.getAllOrders();
      const filteredOrders = orders.filter(order =>
        new Date(order.createdAt) > cutoffDate || order.status === 'pending'
      );
      localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(filteredOrders));

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }


  /**
   * Cherche un produit dans le panier par son ID
   * @param productId ID du produit à rechercher
   * @returns Le produit trouvé ou null
   */
 findProductInCart(productId: number): ItemProduct | null {
 // this.caddy=this.caddy = this.caddie.itemsProducts.flatMap(item => item.product);
   const existingProduct = this.caddie.itemsProducts.find(item => item.product.id === productId);
  return existingProduct || null;
 }

 

  
  /**
   * Retire un produit du panier
   * @param productId ID du produit à retirer
   */
 removeProductFromCart(productId: number): void {
  const index = this.caddie.itemsProducts.findIndex(
    item => item.product.id === productId
  );

  if (index !== -1) {
    const item = this.caddie.itemsProducts[index];

    // Si la quantité est > 1, on décrémente
    if (item.quantite > 1) {
      item.quantite--;
    } else {
      // Sinon, on supprime le produit complètement
      this.caddie.itemsProducts.splice(index, 1);
    }

    this.saveCaddyToStorage();

    // Si tu utilises un observable pour mettre à jour l'UI
    // this.cartUpdatedSubject.next(this.caddie);
  }
}

   /**
   * Sauvegarde le panier dans le localStorage
   */
  private saveCaddyToStorage(): void {
    try {
      localStorage.setItem('caddy', JSON.stringify(this.caddie));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }
   /**
   * Met à jour la quantité d'un produit dans le panier
   * @param productId ID du produit
   * @param newQuantity Nouvelle quantité
   */
  updateProductQuantityInCart(productId: number, newQuantity: number): void {
    console.log("quantite a mettre a jou ",newQuantity)
    const existingProductIndex = this.caddie.itemsProducts.findIndex(item => item.product.id === productId);
           console.log("index :" ,existingProductIndex)
    if (existingProductIndex !== -1) {
      this.caddie.itemsProducts[existingProductIndex].quantite = newQuantity;
          console.log("mise a jour ok  :" , this.caddie.itemsProducts[existingProductIndex].quantite)
      this.saveCaddyToStorage();
      
      // Émettre un événement si vous utilisez des observables
      // this.cartUpdatedSubject.next(this.caddy);
    }
  }
}