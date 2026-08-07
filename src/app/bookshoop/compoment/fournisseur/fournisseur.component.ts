import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Fournisseur } from '../../model/fournisseur';
import { FournisseurService } from '../../service/Fournisseur.service';

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

  constructor(private fournisseurService: FournisseurService) {}

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
      indicatifPays: ''
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
