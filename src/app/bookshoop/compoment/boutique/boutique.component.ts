// src/app/components/boutique/boutique.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';


declare var $: any;

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique.component.html',
  styleUrls: ['./boutique.component.css']
})
export class BoutiqueComponent implements OnInit {
  boutiques: Boutique[] = [];
  selectedBoutique: Boutique = { code: '', nom: '' };
  isEditMode = false;
  searchTerm = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private boutiqueService: BoutiqueService) {}

  ngOnInit(): void {
    this.loadBoutiques();
  }

  loadBoutiques(): void {
    this.boutiqueService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.boutiques = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des boutiques', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(boutique?: Boutique): void {
    if (boutique) {
      this.isEditMode = true;
      this.selectedBoutique = { ...boutique };
    } else {
      this.isEditMode = false;
      this.selectedBoutique = { code: '', nom: '' };
    }
    $('#boutiqueModal').modal('show');
  }

  saveBoutique(): void {
    if (this.isEditMode && this.selectedBoutique.id) {
      this.boutiqueService.update(this.selectedBoutique.id, this.selectedBoutique)
        .subscribe({
          next: () => {
            this.loadBoutiques();
            $('#boutiqueModal').modal('hide');
            this.showToast('Boutique modifiée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.boutiqueService.create(this.selectedBoutique)
        .subscribe({
          next: () => {
            this.loadBoutiques();
            $('#boutiqueModal').modal('hide');
            this.showToast('Boutique créée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteBoutique(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      this.boutiqueService.delete(id)
        .subscribe({
          next: () => {
            this.loadBoutiques();
            this.showToast('Boutique supprimée avec succès', 'success');
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
    this.loadBoutiques();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadBoutiques();
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