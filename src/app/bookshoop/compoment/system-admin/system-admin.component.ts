import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { User } from '../../model/user';
import { CreateSystemAdminRequest } from '../../model/create-system-admin-request';
import { SystemAdminService } from '../../service/system-admin.service';

declare var $: any;

@Component({
  selector: 'app-system-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-admin.component.html',
  styleUrls: ['./system-admin.component.css']
})
export class SystemAdminComponent implements OnInit {
  systemAdmins: User[] = [];
  newSystemAdmin: CreateSystemAdminRequest = this.emptyRequest();
  loading = false;

  // Dialog d'affichage des identifiants generes (creation ou reinitialisation).
  credentialsUsername = '';
  credentialsPassword = '';

  constructor(private systemAdminService: SystemAdminService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadSystemAdmins();
  }

  loadSystemAdmins(): void {
    this.loading = true;
    this.systemAdminService.getAll().subscribe({
      next: (data) => {
        this.systemAdmins = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error("Impossible de charger la liste des administrateurs système.");
        console.error(error);
      }
    });
  }

  openModal(): void {
    this.newSystemAdmin = this.emptyRequest();
    $('#systemAdminModal').modal('show');
  }

  save(): void {
    this.systemAdminService.create(this.newSystemAdmin).subscribe({
      next: (result) => {
        $('#systemAdminModal').modal('hide');
        this.loadSystemAdmins();
        this.showCredentials(result.user.userName, result.generatedPassword);
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || "Erreur lors de la création de l'administrateur système.");
        console.error(error);
      }
    });
  }

  resetPassword(admin: User): void {
    this.systemAdminService.resetPassword(admin.id!).subscribe({
      next: (result) => this.showCredentials(admin.userName, result.generatedPassword),
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Erreur lors de la réinitialisation du mot de passe.');
        console.error(error);
      }
    });
  }

  toggleActive(admin: User): void {
    const activer = !admin.isActive;
    const motif = window.prompt(
      activer ? `Motif d'activation de ${admin.userName} :` : `Motif de désactivation de ${admin.userName} :`
    );
    if (motif === null) {
      return;
    }
    if (!motif.trim()) {
      this.toastr.warning('Un motif est obligatoire.');
      return;
    }

    const action$ = activer
      ? this.systemAdminService.activer(admin.id!, motif)
      : this.systemAdminService.desactiver(admin.id!, motif);

    action$.subscribe({
      next: () => {
        this.loadSystemAdmins();
        this.toastr.success(activer ? 'Administrateur activé.' : 'Administrateur désactivé.');
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || "Erreur lors du changement de statut.");
        console.error(error);
      }
    });
  }

  copyToClipboard(value: string): void {
    navigator.clipboard.writeText(value).then(
      () => this.toastr.success('Copié dans le presse-papiers.'),
      () => this.toastr.error('Impossible de copier automatiquement, sélectionnez et copiez manuellement.')
    );
  }

  private showCredentials(username: string, generatedPassword: string | undefined): void {
    this.credentialsUsername = username;
    this.credentialsPassword = generatedPassword || '';
    $('#credentialsModal').modal('show');
  }

  private emptyRequest(): CreateSystemAdminRequest {
    return { userName: '' };
  }
}
