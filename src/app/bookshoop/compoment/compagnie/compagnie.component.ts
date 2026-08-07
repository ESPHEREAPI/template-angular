import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Compagnie } from '../../model/compagnie';
import { CreateCompagnieRequest } from '../../model/create-compagnie-request';
import { TypeCommerce, TYPE_COMMERCE_LABELS } from '../../model/type-commerce';
import { CompagnieService } from '../../service/compagnie.service';

declare var $: any;

@Component({
  selector: 'app-compagnie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compagnie.component.html',
  styleUrls: ['./compagnie.component.css']
})
export class CompagnieComponent implements OnInit {
  compagnies: Compagnie[] = [];
  newCompagnie: CreateCompagnieRequest = this.emptyRequest();
  loading = false;

  readonly typeCommerceOptions = Object.values(TypeCommerce);
  readonly typeCommerceLabels = TYPE_COMMERCE_LABELS;

  // Dialog d'affichage des identifiants generes (creation ou reinitialisation).
  credentialsUsername = '';
  credentialsPassword = '';

  constructor(private compagnieService: CompagnieService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadCompagnies();
  }

  loadCompagnies(): void {
    this.loading = true;
    this.compagnieService.getAll().subscribe({
      next: (data) => {
        this.compagnies = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error("Impossible de charger la liste des compagnies.");
        console.error(error);
      }
    });
  }

  openModal(): void {
    this.newCompagnie = this.emptyRequest();
    $('#compagnieModal').modal('show');
  }

  save(): void {
    if (!this.newCompagnie.nom || !this.newCompagnie.typeCommerce) {
      this.toastr.warning('Le nom de la compagnie et le type de commerce sont obligatoires.');
      return;
    }

    this.compagnieService.create(this.newCompagnie).subscribe({
      next: (result) => {
        $('#compagnieModal').modal('hide');
        this.loadCompagnies();
        this.showCredentials(result.admin.userName, result.generatedAdminPassword);
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Erreur lors de la création de la compagnie.');
        console.error(error);
      }
    });
  }

  resetAdminPassword(compagnie: Compagnie): void {
    this.compagnieService.resetAdminPassword(compagnie.id!).subscribe({
      next: (result) => this.showCredentials('', result.generatedPassword),
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Erreur lors de la réinitialisation du mot de passe.');
        console.error(error);
      }
    });
  }

  toggleActive(compagnie: Compagnie): void {
    const activer = !compagnie.actif;
    const motif = window.prompt(
      activer ? `Motif d'activation de ${compagnie.nom} :` : `Motif de désactivation de ${compagnie.nom} :`
    );
    if (motif === null) {
      return;
    }
    if (!motif.trim()) {
      this.toastr.warning('Un motif est obligatoire.');
      return;
    }

    const action$ = activer
      ? this.compagnieService.activer(compagnie.id!, motif)
      : this.compagnieService.desactiver(compagnie.id!, motif);

    action$.subscribe({
      next: () => {
        this.loadCompagnies();
        this.toastr.success(activer ? 'Compagnie activée.' : 'Compagnie désactivée.');
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Erreur lors du changement de statut.');
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

  private emptyRequest(): CreateCompagnieRequest {
    return {
      nom: '',
      typeCommerce: TypeCommerce.AUTRE,
      adminUserName: ''
    };
  }
}
