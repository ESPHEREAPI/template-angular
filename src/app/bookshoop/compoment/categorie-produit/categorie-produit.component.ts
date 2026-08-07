import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categorie } from '../../model/categorie';
import { CategorieService } from '../../service/Categorie.service';

declare var $: any;

@Component({
  selector: 'app-categorie-produit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorie-produit.component.html',
  styleUrls: ['./categorie-produit.component.css']
})
export class CategorieProduitComponent implements OnInit {
  categories: Categorie[] = [];
  selectedCategorie: Categorie = { code: '', libelle: '' };
  isEditMode = false;
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private categorieService: CategorieService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categorieService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.categories = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des catégories', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(categorie?: Categorie): void {
    if (categorie) {
      this.isEditMode = true;
      this.selectedCategorie = { ...categorie };
    } else {
      this.isEditMode = false;
      this.selectedCategorie = { code: '', libelle: '' };
    }
    $('#categorieModal').modal('show');
  }

  saveCategorie(): void {
    if (this.isEditMode && this.selectedCategorie.id) {
      this.categorieService.update(this.selectedCategorie.id, this.selectedCategorie)
        .subscribe({
          next: () => {
            this.loadCategories();
            $('#categorieModal').modal('hide');
            this.showToast('Catégorie modifiée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.categorieService.create(this.selectedCategorie)
        .subscribe({
          next: () => {
            this.loadCategories();
            $('#categorieModal').modal('hide');
            this.showToast('Catégorie créée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteCategorie(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.categorieService.delete(id)
        .subscribe({
          next: () => {
            this.loadCategories();
            this.showToast('Catégorie supprimée avec succès', 'success');
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
    this.loadCategories();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadCategories();
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
