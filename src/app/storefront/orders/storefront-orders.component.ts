import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontAuthService } from '../service/storefront-auth.service';
import { StorefrontCheckoutService } from '../service/storefront-checkout.service';
import { CommandeResume } from '../model/storefront-order';

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storefront-orders.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontOrdersComponent implements OnInit {
  code = '';
  commandes: CommandeResume[] = [];
  chargement = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public storefrontAuth: StorefrontAuthService,
    private checkoutService: StorefrontCheckoutService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    if (!this.storefrontAuth.isLoggedIn) {
      this.router.navigate(['/shop', this.code, 'login']);
      return;
    }
    this.checkoutService.mesCommandes(this.code).subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
      }
    });
  }
}
