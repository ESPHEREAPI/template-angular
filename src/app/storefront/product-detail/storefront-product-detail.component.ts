import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StorefrontCatalogService } from '../service/storefront-catalog.service';
import { StorefrontCartService } from '../service/storefront-cart.service';
import { ArticlePublic } from '../model/storefront-catalog';

@Component({
  selector: 'app-storefront-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './storefront-product-detail.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontProductDetailComponent implements OnInit {
  code = '';
  boutiqueId = 0;
  produitId = 0;
  produit: ArticlePublic | null = null;
  chargement = true;
  introuvable = false;
  photoEnErreur = false;
  quantite = 1;
  ajoute = false;

  constructor(
    private route: ActivatedRoute,
    private catalogService: StorefrontCatalogService,
    public cart: StorefrontCartService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.boutiqueId = Number(this.route.snapshot.paramMap.get('boutiqueId'));
    this.produitId = Number(this.route.snapshot.paramMap.get('produitId'));
    this.cart.pourCompagnie(this.code);

    this.catalogService.getProduitDetail(this.code, this.boutiqueId, this.produitId).subscribe({
      next: (produit) => {
        this.produit = produit;
        this.chargement = false;
      },
      error: () => {
        this.introuvable = true;
        this.chargement = false;
      }
    });
  }

  photoUrl(): string {
    return this.catalogService.photoUrl(this.code, this.produitId);
  }

  onPhotoErreur(): void {
    this.photoEnErreur = true;
  }

  ajouterAuPanier(): void {
    if (!this.produit) {
      return;
    }
    this.cart.ajouter(
      {
        produitId: this.produit.produitId,
        reference: this.produit.reference,
        libelle: this.produit.libelle,
        prixUnitaire: this.produit.prixEffectif,
        quantite: this.quantite,
        stockDisponible: this.produit.quantiteDisponible
      },
      this.boutiqueId
    );
    this.ajoute = true;
    setTimeout(() => (this.ajoute = false), 1500);
  }
}
