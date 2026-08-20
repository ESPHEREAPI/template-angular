import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { StorefrontCatalogService } from '../service/storefront-catalog.service';
import { StorefrontCartService } from '../service/storefront-cart.service';
import { ArticlePublic, CategoriePublique } from '../model/storefront-catalog';

@Component({
  selector: 'app-storefront-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './storefront-catalog.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontCatalogComponent implements OnInit, OnDestroy {
  code = '';
  boutiqueId = 0;
  produits: ArticlePublic[] = [];
  categories: CategoriePublique[] = [];
  categorieSelectionnee: number | null = null;
  searchTerm = '';
  chargement = true;
  page = 0;
  totalPages = 0;
  ajoutes = new Set<number>();
  photosEnErreur = new Set<number>();

  private recherche$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private catalogService: StorefrontCatalogService,
    public cart: StorefrontCartService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.boutiqueId = Number(this.route.snapshot.paramMap.get('boutiqueId'));
    this.cart.pourCompagnie(this.code);

    this.recherche$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((terme) => {
      this.searchTerm = terme;
      this.page = 0;
      this.charger();
    });

    this.catalogService.getCategories(this.code, this.boutiqueId).subscribe({
      next: (categories) => (this.categories = categories),
      error: () => {}
    });

    this.charger();
  }

  ngOnDestroy(): void {
    this.recherche$.complete();
  }

  onRecherche(terme: string): void {
    this.recherche$.next(terme);
  }

  selectionnerCategorie(categorieId: number | null): void {
    if (this.categorieSelectionnee === categorieId) {
      return;
    }
    this.categorieSelectionnee = categorieId;
    this.page = 0;
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.catalogService
      .getProduits(this.code, this.boutiqueId, this.page, 20, this.categorieSelectionnee, this.searchTerm)
      .subscribe({
        next: (result) => {
          this.produits = result.content;
          this.totalPages = result.totalPages;
          this.chargement = false;
        },
        error: () => {
          this.chargement = false;
        }
      });
  }

  pageSuivante(): void {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.charger();
    }
  }

  pagePrecedente(): void {
    if (this.page > 0) {
      this.page--;
      this.charger();
    }
  }

  photoUrl(produit: ArticlePublic): string {
    return this.catalogService.photoUrl(this.code, produit.produitId);
  }

  onPhotoErreur(produitId: number): void {
    this.photosEnErreur.add(produitId);
  }

  ajouterAuPanier(produit: ArticlePublic): void {
    this.cart.ajouter(
      {
        produitId: produit.produitId,
        reference: produit.reference,
        libelle: produit.libelle,
        prixUnitaire: produit.prixEffectif,
        quantite: 1,
        stockDisponible: produit.quantiteDisponible
      },
      this.boutiqueId
    );
    this.ajoutes.add(produit.produitId);
    setTimeout(() => this.ajoutes.delete(produit.produitId), 1500);
  }
}
