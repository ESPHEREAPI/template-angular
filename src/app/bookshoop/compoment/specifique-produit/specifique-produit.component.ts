import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Specifique } from '../../model/specifique';
import { Categorie } from '../../model/categorie';
import { SpecifiqueService } from '../../service/Specifique.service';
import { CategorieService } from '../../service/Categorie.service';

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
  categories: Categorie[] = [];
  selectedSpecifique: Specifique = { code: '', libelle: '', categorieId: null };
  isEditMode = false;
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private specifiqueService: SpecifiqueService, private categorieService: CategorieService) {}

  ngOnInit(): void {
    this.loadSpecifiques();
    this.categorieService.getAllSimple().subscribe({
      next: (categories) => this.categories = categories,
      error: () => {}
    });
  }

  categorieLibelle(specifique: Specifique): string {
    return specifique.categorie?.libelle ?? 'Toutes catégories';
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
      this.selectedSpecifique = { ...specifique, categorieId: specifique.categorie?.id ?? null };
    } else {
      this.isEditMode = false;
      this.selectedSpecifique = { code: '', libelle: '', categorieId: null };
    }
    $('#specifiqueModal').modal('show');
  }

  private construirePayload(): Specifique {
    // Le backend attend une Categories imbriquee ({id: X}) pour que Jackson
    // la lie a l'association @ManyToOne, pas un categorieId a plat (celui-ci
    // n'existe cote backend qu'en lecture, jamais en ecriture).
    const { categorieId, ...reste } = this.selectedSpecifique;
    return { ...reste, categorie: categorieId ? { id: categorieId } as any : null };
  }

  saveSpecifique(): void {
    const payload = this.construirePayload();
    if (this.isEditMode && this.selectedSpecifique.id) {
      this.specifiqueService.update(this.selectedSpecifique.id, payload)
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
      this.specifiqueService.create(payload)
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
