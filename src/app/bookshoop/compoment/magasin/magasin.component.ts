// src/app/components/magasin/magasin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Magasin } from '../../model/Magasin';
import { Ville } from '../../model/ville';
import { Boutique } from '../../model/boutique';
import { MagasinService } from '../../service/Magasin.service';
import { VilleService } from '../../service/Ville.service';
import { BoutiqueService } from '../../service/boutique.service';

declare var $: any;

@Component({
  selector: 'app-magasin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './magasin.component.html',
  styleUrls: ['./magasin.component.css']
})
export class MagasinComponent implements OnInit {
  magasins: Magasin[] = [];
  villes: Ville[] = [];
  boutiques: Boutique[] = [];
  selectedMagasin: Magasin = { code: '', libelle: '' };
  isEditMode = false;
  searchTerm = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private magasinService: MagasinService,
    private villeService: VilleService,
    private boutiqueService: BoutiqueService
  ) {}

  ngOnInit(): void {
    this.loadMagasins();
    this.loadVilles();
   this.loadBoutiques();
  }

  loadMagasins(): void {
    this.magasinService.getAll(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.magasins = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          console.log(response.content);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des magasins', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  loadVilles(): void {
    this.villeService.getAllSimple()
      .subscribe({
        next: (villes) => {
          this.villes = villes;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des villes', error);
        }
      });
  }

  loadBoutiques(): void {
    this.boutiqueService.getBoutiques()
      .subscribe({
        next: (boutiques) => {
          this.boutiques = boutiques;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des boutiques', error);
        }
      });
  }

  openModal(magasin?: Magasin): void {
    if (magasin) {
      this.isEditMode = true;
      this.selectedMagasin = { 
        ...magasin,
        villeid: magasin.ville,
        boutiqueId: magasin.boutique
      };
    } else {
      this.isEditMode = false;
      this.selectedMagasin = { code: '', libelle: '' };
    }
    $('#magasinModal').modal('show');
  }

  saveMagasin(): void {
    if (this.isEditMode && this.selectedMagasin.id) {
      this.magasinService.update(this.selectedMagasin.id, this.selectedMagasin)
        .subscribe({
          next: () => {
            this.loadMagasins();
            $('#magasinModal').modal('hide');
            this.showToast('Magasin modifié avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.magasinService.create(this.selectedMagasin)
        .subscribe({
          next: () => {
            this.loadMagasins();
            $('#magasinModal').modal('hide');
            this.showToast('Magasin créé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteMagasin(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce magasin ?')) {
      this.magasinService.delete(id)
        .subscribe({
          next: () => {
            this.loadMagasins();
            this.showToast('Magasin supprimé avec succès', 'success');
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
    this.loadMagasins();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadMagasins();
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