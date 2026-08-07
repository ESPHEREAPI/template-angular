import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Verrouillage } from '../../model/verrouillage';
import { VerrouillageService } from '../../service/Verrouillage.service';

declare var $: any;

@Component({
  selector: 'app-verrouillage-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verrouillage-stock.component.html',
  styleUrls: ['./verrouillage-stock.component.css']
})
export class VerrouillageStockComponent implements OnInit {
  verrouillages: Verrouillage[] = [];
  selectedVerrouillage: Verrouillage = this.emptyVerrouillage();
  isEditMode = false;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(private verrouillageService: VerrouillageService) {}

  ngOnInit(): void {
    this.loadVerrouillages();
  }

  emptyVerrouillage(): Verrouillage {
    return {
      datedebut: '',
      dateFin: '',
      montant: undefined,
      taux: undefined,
      typeVerrou: '',
      verrouAuto: false,
      verrouManuel: false
    };
  }

  loadVerrouillages(): void {
    this.verrouillageService.getAll(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.verrouillages = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des verrouillages', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(verrouillage?: Verrouillage): void {
    if (verrouillage) {
      this.isEditMode = true;
      this.selectedVerrouillage = { ...verrouillage };
    } else {
      this.isEditMode = false;
      this.selectedVerrouillage = this.emptyVerrouillage();
    }
    $('#verrouillageModal').modal('show');
  }

  saveVerrouillage(): void {
    if (this.isEditMode && this.selectedVerrouillage.id) {
      this.verrouillageService.update(this.selectedVerrouillage.id, this.selectedVerrouillage)
        .subscribe({
          next: () => {
            this.loadVerrouillages();
            $('#verrouillageModal').modal('hide');
            this.showToast('Verrouillage modifié avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.verrouillageService.create(this.selectedVerrouillage)
        .subscribe({
          next: () => {
            this.loadVerrouillages();
            $('#verrouillageModal').modal('hide');
            this.showToast('Verrouillage créé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteVerrouillage(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce verrouillage ?')) {
      this.verrouillageService.delete(id)
        .subscribe({
          next: () => {
            this.loadVerrouillages();
            this.showToast('Verrouillage supprimé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.showToast('Erreur de suppression', 'error');
          }
        });
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadVerrouillages();
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
