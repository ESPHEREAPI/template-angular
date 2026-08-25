import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontCartService } from '../service/storefront-cart.service';
import { StorefrontAuthService } from '../service/storefront-auth.service';
import { StorefrontCheckoutService } from '../service/storefront-checkout.service';
import { CommandeResponse } from '../model/storefront-order';

@Component({
  selector: 'app-storefront-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './storefront-checkout.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontCheckoutComponent implements OnInit {
  code = '';

  guestNom = '';
  guestTelephone = '';
  guestEmail = '';
  guestAdresse = '';

  envoiEnCours = false;
  erreur: string | null = null;
  confirmation: CommandeResponse | null = null;
  // produitId -> motif ("Rupture de stock", "Stock insuffisant (disponible : 2)"...)
  // renvoye par le backend quand la confirmation echoue parce qu'un ou
  // plusieurs articles du panier ne sont plus disponibles - permet de
  // souligner precisement la/les lignes en cause plutot qu'un message
  // d'erreur generique qui ne dit pas lequel retirer.
  articlesIndisponibles = new Map<number, string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public cart: StorefrontCartService,
    public storefrontAuth: StorefrontAuthService,
    private checkoutService: StorefrontCheckoutService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.cart.pourCompagnie(this.code);
  }

  get estInvite(): boolean {
    return !this.storefrontAuth.isLoggedIn;
  }

  get formulaireValide(): boolean {
    return this.estInvite ? this.guestNom.trim().length > 0 && this.guestTelephone.trim().length > 0 : true;
  }

  confirmer(): void {
    if (this.cart.boutiqueId === null || this.cart.items.length === 0 || !this.formulaireValide) {
      return;
    }
    this.envoiEnCours = true;
    this.erreur = null;
    this.articlesIndisponibles.clear();

    const request = {
      items: this.cart.items.map((i) => ({ produitId: i.produitId, quantite: i.quantite })),
      ...(this.estInvite
        ? {
            guestNom: this.guestNom,
            guestTelephone: this.guestTelephone,
            guestEmail: this.guestEmail || undefined,
            guestAdresse: this.guestAdresse || undefined
          }
        : {})
    };

    this.checkoutService.passerCommande(this.code, this.cart.boutiqueId, request).subscribe({
      next: (reponse) => {
        this.confirmation = reponse;
        this.envoiEnCours = false;
        this.cart.vider();
      },
      error: (err) => {
        this.erreur = err?.error?.message || "Une erreur est survenue lors de l'envoi de la commande.";
        const produitsIndisponibles: { produitId: number; motif: string }[] = err?.error?.produitsIndisponibles || [];
        for (const p of produitsIndisponibles) {
          this.articlesIndisponibles.set(p.produitId, p.motif);
        }
        this.envoiEnCours = false;
      }
    });
  }

  estIndisponible(produitId: number): boolean {
    return this.articlesIndisponibles.has(produitId);
  }

  motifIndisponibilite(produitId: number): string | undefined {
    return this.articlesIndisponibles.get(produitId);
  }

  retirerArticle(produitId: number): void {
    this.cart.retirer(produitId);
    this.articlesIndisponibles.delete(produitId);
    if (this.articlesIndisponibles.size === 0) {
      this.erreur = null;
    }
  }
}
