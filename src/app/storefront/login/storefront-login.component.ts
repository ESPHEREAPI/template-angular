import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontAuthService } from '../service/storefront-auth.service';

@Component({
  selector: 'app-storefront-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './storefront-login.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontLoginComponent implements OnInit {
  code = '';
  email = '';
  password = '';
  erreur: string | null = null;
  envoiEnCours = false;

  constructor(private route: ActivatedRoute, private router: Router, private storefrontAuth: StorefrontAuthService) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
  }

  connexion(): void {
    this.erreur = null;
    this.envoiEnCours = true;
    this.storefrontAuth.login(this.code, this.email, this.password).subscribe({
      next: () => {
        this.envoiEnCours = false;
        this.router.navigate(['/shop', this.code]);
      },
      error: (err) => {
        this.envoiEnCours = false;
        this.erreur = err?.error?.message || 'Email ou mot de passe incorrect.';
      }
    });
  }
}
