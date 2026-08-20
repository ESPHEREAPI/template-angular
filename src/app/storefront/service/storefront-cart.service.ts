import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../model/storefront-cart';

/**
 * Panier 100% cote client (localStorage), pas de persistance serveur pour
 * cette v1 - le backend Paniers existant est orphelin/non tenant-scope, pas
 * une base a reprendre (voir exploration Phase 3). Cle par compagnie (code)
 * pour qu'un visiteur qui navigue sur deux boutiques en ligne differentes
 * dans des onglets separes n'ait pas un panier partage par erreur.
 */
interface PanierStocke {
  boutiqueId: number | null;
  items: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class StorefrontCartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();
  private compagnieCode: string | null = null;
  // Une seule boutique par panier a la fois : ajouter un article d'une
  // AUTRE boutique vide d'abord le panier courant (voir ajouter()) - le
  // checkout cible une seule boutique (POST .../boutiques/{id}/commandes),
  // un panier multi-boutiques n'est pas supporte pour cette v1.
  boutiqueId: number | null = null;

  pourCompagnie(code: string): void {
    if (this.compagnieCode === code) {
      return;
    }
    this.compagnieCode = code;
    const stocke = this.readFromStorage();
    this.boutiqueId = stocke.boutiqueId;
    this.itemsSubject.next(stocke.items);
  }

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  get nombreArticles(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.quantite, 0);
  }

  get total(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.quantite * item.prixUnitaire, 0);
  }

  ajouter(item: CartItem, boutiqueId: number): void {
    let items = this.boutiqueId !== null && this.boutiqueId !== boutiqueId ? [] : [...this.itemsSubject.value];
    this.boutiqueId = boutiqueId;
    const existant = items.find((i) => i.produitId === item.produitId);
    if (existant) {
      existant.quantite = Math.min(existant.quantite + item.quantite, existant.stockDisponible);
    } else {
      items.push(item);
    }
    this.save(items);
  }

  changerQuantite(produitId: number, quantite: number): void {
    const items = this.itemsSubject.value
      .map((i) => (i.produitId === produitId ? { ...i, quantite: Math.max(0, Math.min(quantite, i.stockDisponible)) } : i))
      .filter((i) => i.quantite > 0);
    this.save(items);
  }

  retirer(produitId: number): void {
    this.save(this.itemsSubject.value.filter((i) => i.produitId !== produitId));
  }

  vider(): void {
    this.save([]);
  }

  private save(items: CartItem[]): void {
    this.itemsSubject.next(items);
    if (this.compagnieCode) {
      const stocke: PanierStocke = { boutiqueId: this.boutiqueId, items };
      localStorage.setItem(this.storageKey(), JSON.stringify(stocke));
    }
  }

  private readFromStorage(): PanierStocke {
    const raw = localStorage.getItem(this.storageKey());
    if (!raw) {
      return { boutiqueId: null, items: [] };
    }
    try {
      return JSON.parse(raw) as PanierStocke;
    } catch {
      return { boutiqueId: null, items: [] };
    }
  }

  private storageKey(): string {
    return `storefrontCart_${this.compagnieCode}`;
  }
}
