// src/app/components/ville/ville.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ville } from '../../model/ville';
import { VilleService } from '../../service/Ville.service';


declare var $: any;

@Component({
  selector: 'app-ville',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ville.component.html',
  styleUrls: ['./ville.component.css']
})
export class VilleComponent implements OnInit {
  villes: Ville[] = [];
  selectedVille: Ville = { code: '', libelle: '' };
  isEditMode = false;
  searchTerm = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private villeService: VilleService) {}

  ngOnInit(): void {
    this.loadVilles();
  }

  loadVilles(): void {
    this.villeService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.villes = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des villes', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(ville?: Ville): void {
    if (ville) {
      this.isEditMode = true;
      this.selectedVille = { ...ville };
    } else {
      this.isEditMode = false;
      this.selectedVille = { code: '', libelle: '' };
    }
    $('#villeModal').modal('show');
  }

  saveVille(): void {
    if (this.isEditMode && this.selectedVille.id) {
      this.villeService.update(this.selectedVille.id, this.selectedVille)
        .subscribe({
          next: () => {
            this.loadVilles();
            $('#villeModal').modal('hide');
            this.showToast('Ville modifiée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.villeService.create(this.selectedVille)
        .subscribe({
          next: () => {
            this.loadVilles();
            $('#villeModal').modal('hide');
            this.showToast('Ville créée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteVille(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) {
      this.villeService.delete(id)
        .subscribe({
          next: () => {
            this.loadVilles();
            this.showToast('Ville supprimée avec succès', 'success');
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
    this.loadVilles();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadVilles();
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