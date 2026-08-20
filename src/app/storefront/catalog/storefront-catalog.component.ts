import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StorefrontCatalogService } from '../service/storefront-catalog.service';
import { StorefrontCartService } from '../service/storefront-cart.service';
import { ArticlePublic } from '../model/storefront-catalog';

@Component({
  selector: 'app-storefront-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storefront-catalog.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontCatalogComponent implements OnInit {
  code = '';
  boutiqueId = 0;
  produits: ArticlePublic[] = [];
  chargement = true;
  page = 0;
  totalPages = 0;
  ajoutes = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private catalogService: StorefrontCatalogService,
    public cart: StorefrontCartService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.boutiqueId = Number(this.route.snapshot.paramMap.get('boutiqueId'));
    this.cart.pourCompagnie(this.code);
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.catalogService.getProduits(this.code, this.boutiqueId, this.page).subscribe({
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

  ajouterAuPanier(produit: ArticlePublic): void {
    this.cart.ajouter(
      {
        produitId: produit.produitId,
        reference: produit.reference,
        libelle: produit.libelle,
        prixUnitaire: produit.prixVenteNet,
        quantite: 1,
        stockDisponible: produit.quantiteDisponible
      },
      this.boutiqueId
    );
    this.ajoutes.add(produit.produitId);
    setTimeout(() => this.ajoutes.delete(produit.produitId), 1500);
  }
}
