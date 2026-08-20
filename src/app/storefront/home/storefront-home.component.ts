import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontCatalogService } from '../service/storefront-catalog.service';
import { CompagniePublique } from '../model/storefront-catalog';

@Component({
  selector: 'app-storefront-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storefront-home.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontHomeComponent implements OnInit {
  code = '';
  compagnie: CompagniePublique | null = null;
  chargement = true;
  erreur = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: StorefrontCatalogService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.catalogService.getCompagnie(this.code).subscribe({
      next: (compagnie) => {
        this.compagnie = compagnie;
        this.chargement = false;
        // Une seule boutique : on saute directement au catalogue.
        if (compagnie.boutiques.length === 1) {
          this.router.navigate(['/shop', this.code, 'boutique', compagnie.boutiques[0].id]);
        }
      },
      error: () => {
        this.erreur = true;
        this.chargement = false;
      }
    });
  }
}
