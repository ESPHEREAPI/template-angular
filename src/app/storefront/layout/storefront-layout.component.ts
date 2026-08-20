import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { StorefrontAuthService } from '../service/storefront-auth.service';
import { StorefrontCartService } from '../service/storefront-cart.service';
import { StorefrontCatalogService } from '../service/storefront-catalog.service';
import { BoutiquePublique } from '../model/storefront-catalog';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storefront-layout.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontLayoutComponent implements OnInit, OnDestroy {
  code = '';
  boutiques: BoutiquePublique[] = [];
  boutiqueActuelle: BoutiquePublique | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: StorefrontCatalogService,
    public storefrontAuth: StorefrontAuthService,
    public cart: StorefrontCartService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.cart.pourCompagnie(this.code);

    this.catalogService.getCompagnie(this.code).subscribe({
      next: (compagnie) => {
        this.boutiques = compagnie.boutiques;
        this.mettreAJourBoutiqueActuelle();
      },
      error: () => {}
    });

    // Le layout reste la meme instance de composant en naviguant entre
    // accueil/catalogue/panier/checkout (seule une route enfant change) -
    // ngOnInit ne se redeclenche pas, il faut donc reagir explicitement a
    // chaque navigation pour savoir dans quelle boutique on se trouve.
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.mettreAJourBoutiqueActuelle());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private mettreAJourBoutiqueActuelle(): void {
    let snapshot: ActivatedRouteSnapshot = this.route.snapshot;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    const boutiqueId = Number(snapshot.paramMap.get('boutiqueId'));
    this.boutiqueActuelle = boutiqueId
      ? this.boutiques.find((b) => b.id === boutiqueId) ?? null
      : null;
  }

  deconnexion(): void {
    this.storefrontAuth.logout();
    this.router.navigate(['/shop', this.code]);
  }
}
