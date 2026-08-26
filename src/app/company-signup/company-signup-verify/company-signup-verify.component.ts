import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CompanySignupService } from '../company-signup.service';

@Component({
  selector: 'app-company-signup-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-signup-verify.component.html',
  styleUrls: ['../company-signup-form/company-signup-form.component.css']
})
export class CompanySignupVerifyComponent implements OnInit {
  enCours = true;
  succes = false;
  erreur: string | null = null;

  emailRenvoi = '';
  renvoiEnCours = false;
  renvoiEnvoye = false;

  constructor(private route: ActivatedRoute, private signupService: CompanySignupService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.enCours = false;
      this.erreur = 'Lien de vérification invalide.';
      return;
    }

    this.signupService.verifierEmail(token).subscribe({
      next: () => {
        this.succes = true;
        this.enCours = false;
      },
      error: (err) => {
        this.erreur = err?.error?.message || 'Ce lien est invalide ou a expiré.';
        this.enCours = false;
      }
    });
  }

  renvoyer(): void {
    if (!this.emailRenvoi.trim()) {
      return;
    }
    this.renvoiEnCours = true;
    this.signupService.renvoyerVerification(this.emailRenvoi.trim()).subscribe({
      next: () => {
        this.renvoiEnvoye = true;
        this.renvoiEnCours = false;
      },
      error: () => {
        // Le backend repond toujours pareil (email existant ou non) - un
        // echec ici ne peut venir que d'un probleme reseau/serveur.
        this.renvoiEnvoye = true;
        this.renvoiEnCours = false;
      }
    });
  }
}
