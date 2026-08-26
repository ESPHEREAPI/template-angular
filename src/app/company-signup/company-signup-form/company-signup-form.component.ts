import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CompanySignupService } from '../company-signup.service';
import { CreateCompagnieRequest } from '../../bookshoop/model/create-compagnie-request';
import { TypeCommerce, TYPE_COMMERCE_LABELS } from '../../bookshoop/model/type-commerce';

@Component({
  selector: 'app-company-signup-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-signup-form.component.html',
  styleUrls: ['./company-signup-form.component.css']
})
export class CompanySignupFormComponent {
  readonly typesCommerce = Object.values(TypeCommerce);
  readonly typeCommerceLabels = TYPE_COMMERCE_LABELS;

  request: CreateCompagnieRequest = {
    nom: '',
    typeCommerce: TypeCommerce.BOUTIQUE,
    adresse: '',
    tel: '',
    email: '',
    adminFirstName: '',
    adminLastname: '',
    adminEmail: '',
    adminPassword: ''
  };
  confirmationMotDePasse = '';

  envoiEnCours = false;
  erreur: string | null = null;
  inscriptionReussie = false;

  constructor(private signupService: CompanySignupService) {}

  get formulaireValide(): boolean {
    return this.request.nom.trim().length > 0
      && !!this.request.typeCommerce
      && (this.request.adminFirstName || '').trim().length > 0
      && (this.request.adminLastname || '').trim().length > 0
      && (this.request.adminEmail || '').trim().length > 0
      && (this.request.adminPassword || '').length >= 8
      && this.request.adminPassword === this.confirmationMotDePasse;
  }

  get motsDePasseDifferents(): boolean {
    return this.confirmationMotDePasse.length > 0 && this.request.adminPassword !== this.confirmationMotDePasse;
  }

  soumettre(): void {
    if (!this.formulaireValide) {
      return;
    }
    this.envoiEnCours = true;
    this.erreur = null;

    this.signupService.inscrire(this.request).subscribe({
      next: () => {
        this.inscriptionReussie = true;
        this.envoiEnCours = false;
      },
      error: (err) => {
        this.erreur = err?.error?.message || "Une erreur est survenue lors de l'inscription.";
        this.envoiEnCours = false;
      }
    });
  }
}
