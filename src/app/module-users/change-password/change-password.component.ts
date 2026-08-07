import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  ancienMotDePasse = '';
  nouveauMotDePasse = '';
  confirmationMotDePasse = '';
  saving = false;

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) {}

  onSubmit(): void {
    if (!this.ancienMotDePasse || !this.nouveauMotDePasse) {
      this.toastr.warning('Tous les champs sont obligatoires.');
      return;
    }
    if (this.nouveauMotDePasse !== this.confirmationMotDePasse) {
      this.toastr.warning('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    if (this.nouveauMotDePasse === this.ancienMotDePasse) {
      this.toastr.warning('Le nouveau mot de passe doit être différent de l\'ancien.');
      return;
    }

    this.saving = true;
    this.authService.changePassword(this.ancienMotDePasse, this.nouveauMotDePasse).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success('Mot de passe modifié. Veuillez vous reconnecter.', 'Succès', { timeOut: 4000 });
        this.authService.logout().subscribe({
          complete: () => this.router.navigateByUrl('login'),
          error: () => this.router.navigateByUrl('login')
        });
      },
      error: (error) => {
        this.saving = false;
        this.toastr.error(error?.error?.message || 'Erreur lors du changement de mot de passe.');
      }
    });
  }
}
