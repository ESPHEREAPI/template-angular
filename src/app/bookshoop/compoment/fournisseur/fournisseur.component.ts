import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Fournisseur } from '../../model/fournisseur';
import { FournisseurService } from '../../service/Fournisseur.service';
import { Magasin } from '../../model/Magasin';
import { MagasinService } from '../../service/Magasin.service';
import { MagasinFournisseur } from '../../model/magasin-fournisseur';
import { MagasinFournisseurService } from '../../service/MagasinFournisseur.service';

declare var $: any;

@Component({
  selector: 'app-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur.component.html',
  styleUrls: ['./fournisseur.component.css']
})
export class FournisseurComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  selectedFournisseur: Fournisseur = this.emptyFournisseur();
  isEditMode = false;
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Depots associes (modal "Depots")
  depotsFournisseur: Fournisseur | null = null;
  magasins: Magasin[] = [];
  associations: MagasinFournisseur[] = [];
  nouveauDepotId: number | null = null;

  constructor(
    private fournisseurService: FournisseurService,
    private magasinService: MagasinService,
    private magasinFournisseurService: MagasinFournisseurService
  ) {}

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  emptyFournisseur(): Fournisseur {
    return {
      nom: '',
      code: '',
      codeSociete: '',
      email: '',
      tel: '',
      fax: '',
      bp: '',
      ville: '',
      quartier: '',
      region: '',
      indicatifPays: '',
      disponiblePartout: false
    };
  }

  loadFournisseurs(): void {
    this.fournisseurService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.fournisseurs = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des fournisseurs', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(fournisseur?: Fournisseur): void {
    if (fournisseur) {
      this.isEditMode = true;
      this.selectedFournisseur = { ...fournisseur };
    } else {
      this.isEditMode = false;
      this.selectedFournisseur = this.emptyFournisseur();
    }
    $('#fournisseurModal').modal('show');
  }

  saveFournisseur(): void {
    if (this.isEditMode && this.selectedFournisseur.id) {
      this.fournisseurService.update(this.selectedFournisseur.id, this.selectedFournisseur)
        .subscribe({
          next: () => {
            this.loadFournisseurs();
            $('#fournisseurModal').modal('hide');
            this.showToast('Fournisseur modifié avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.fournisseurService.create(this.selectedFournisseur)
        .subscribe({
          next: () => {
            this.loadFournisseurs();
            $('#fournisseurModal').modal('hide');
            this.showToast('Fournisseur créé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteFournisseur(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      this.fournisseurService.delete(id)
        .subscribe({
          next: () => {
            this.loadFournisseurs();
            this.showToast('Fournisseur supprimé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.showToast('Erreur de suppression', 'error');
          }
        });
    }
  }

  search(): void {
    this.currentPage = 0;
    this.loadFournisseurs();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadFournisseurs();
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i);
  }

  // ==================== Depots associes ====================

  openDepotsModal(fournisseur: Fournisseur): void {
    this.depotsFournisseur = fournisseur;
    this.nouveauDepotId = null;
    this.loadAssociations();
    if (this.magasins.length === 0) {
      this.magasinService.getAll(0, 1000).subscribe({
        next: (response) => this.magasins = response.content,
        error: (error) => console.error('Erreur lors du chargement des magasins', error)
      });
    }
    $('#depotsModal').modal('show');
  }

  loadAssociations(): void {
    if (!this.depotsFournisseur?.id) { return; }
    this.magasinFournisseurService.getByFournisseur(this.depotsFournisseur.id).subscribe({
      next: (data) => this.associations = data,
      error: (error) => {
        console.error('Erreur lors du chargement des associations', error);
        this.showToast('Erreur de chargement des dépôts associés', 'error');
      }
    });
  }

  magasinsDisponibles(): Magasin[] {
    const associesIds = this.associations.map(a => a.depotId);
    return this.magasins.filter(m => !associesIds.includes(m.id!));
  }

  ajouterAssociation(): void {
    if (!this.nouveauDepotId || !this.depotsFournisseur?.id) { return; }
    this.magasinFournisseurService.create({
      depotId: this.nouveauDepotId,
      fournisseurId: this.depotsFournisseur.id
    }).subscribe({
      next: () => {
        this.nouveauDepotId = null;
        this.loadAssociations();
        this.showToast('Dépôt associé avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de l\'association', error);
        this.showToast(error?.error?.message || 'Erreur lors de l\'association', 'error');
      }
    });
  }

  retirerAssociation(association: MagasinFournisseur): void {
    if (!confirm('Retirer ce dépôt de la liste des fournisseurs associés ?')) { return; }
    this.magasinFournisseurService.delete(association.depotId, association.fournisseurId).subscribe({
      next: () => {
        this.loadAssociations();
        this.showToast('Association retirée', 'success');
      },
      error: (error) => {
        console.error('Erreur lors du retrait', error);
        this.showToast('Erreur lors du retrait de l\'association', 'error');
      }
    });
  }

  showToast(message: string, type: string): void {
    $(document).Toasts('create', {
      title: type === 'success' ? 'Succès' : 'Erreur',
      body: message,
      class: type === 'success' ? 'bg-success' : 'bg-danger',
      autohide: true,
      delay: 3000
    });
  }
}
