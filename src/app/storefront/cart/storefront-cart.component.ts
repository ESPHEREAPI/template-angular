import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StorefrontCartService } from '../service/storefront-cart.service';
import { CartItem } from '../model/storefront-cart';

@Component({
  selector: 'app-storefront-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storefront-cart.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontCartComponent implements OnInit {
  code = '';

  constructor(private route: ActivatedRoute, public cart: StorefrontCartService) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.cart.pourCompagnie(this.code);
  }

  changerQuantite(item: CartItem, quantite: number): void {
    this.cart.changerQuantite(item.produitId, quantite);
  }

  retirer(item: CartItem): void {
    this.cart.retirer(item.produitId);
  }
}
