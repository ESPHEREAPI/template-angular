import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontAuthService } from '../service/storefront-auth.service';
import { StorefrontCartService } from '../service/storefront-cart.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storefront-layout.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontLayoutComponent implements OnInit {
  code = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public storefrontAuth: StorefrontAuthService,
    public cart: StorefrontCartService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.cart.pourCompagnie(this.code);
  }

  deconnexion(): void {
    this.storefrontAuth.logout();
    this.router.navigate(['/shop', this.code]);
  }
}
