import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Specifique } from '../../model/specifique';
import { SpecifiqueService } from '../../service/Specifique.service';

declare var $: any;

@Component({
  selector: 'app-specifique-produit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './specifique-produit.component.html',
  styleUrls: ['./specifique-produit.component.css']
})
export class SpecifiqueProduitComponent implements OnInit {
  specifiques: Specifique[] = [];
  selectedSpecifique: Specifique = { code: '', libelle: '' };
  isEditMode = false;
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private specifiqueService: SpecifiqueService) {}

  ngOnInit(): void {
    this.loadSpecifiques();
  }

  loadSpecifiques(): void {
    this.specifiqueService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.specifiques = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des spécificités', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(specifique?: Specifique): void {
    if (specifique) {
      this.isEditMode = true;
      this.selectedSpecifique = { ...specifique };
    } else {
      this.isEditMode = false;
      this.selectedSpecifique = { code: '', libelle: '' };
    }
    $('#specifiqueModal').modal('show');
  }

  saveSpecifique(): void {
    if (this.isEditMode && this.selectedSpecifique.id) {
      this.specifiqueService.update(this.selectedSpecifique.id, this.selectedSpecifique)
        .subscribe({
          next: () => {
            this.loadSpecifiques();
            $('#specifiqueModal').modal('hide');
            this.showToast('Spécificité modifiée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.specifiqueService.create(this.selectedSpecifique)
        .subscribe({
          next: () => {
            this.loadSpecifiques();
            $('#specifiqueModal').modal('hide');
            this.showToast('Spécificité créée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteSpecifique(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette spécificité ?')) {
      this.specifiqueService.delete(id)
        .subscribe({
          next: () => {
            this.loadSpecifiques();
            this.showToast('Spécificité supprimée avec succès', 'success');
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
    this.loadSpecifiques();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadSpecifiques();
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
