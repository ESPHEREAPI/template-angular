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
        this.envoiEnCours = false;
      }
    });
  }
}
