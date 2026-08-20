import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontAuthService } from '../service/storefront-auth.service';

@Component({
  selector: 'app-storefront-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './storefront-register.component.html',
  styleUrls: ['../storefront-shared.css']
})
export class StorefrontRegisterComponent implements OnInit {
  code = '';
  nom = '';
  email = '';
  telephone = '';
  password = '';
  erreur: string | null = null;
  envoiEnCours = false;

  constructor(private route: ActivatedRoute, private router: Router, private storefrontAuth: StorefrontAuthService) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
  }

  creerCompte(): void {
    this.erreur = null;
    if (this.password.length < 6) {
      this.erreur = 'Le mot de passe doit contenir au moins 6 caracteres.';
      return;
    }
    this.envoiEnCours = true;
    this.storefrontAuth.register(this.code, this.email, this.password, this.nom, this.telephone).subscribe({
      next: () => {
        this.envoiEnCours = false;
        this.router.navigate(['/shop', this.code]);
      },
      error: (err) => {
        this.envoiEnCours = false;
        this.erreur = err?.error?.message || 'Impossible de creer le compte.';
      }
    });
  }
}
