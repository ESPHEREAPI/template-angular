import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Annee } from '../../model/annee';
import { AnneeService } from '../../service/Annee.service';

declare var $: any;

@Component({
  selector: 'app-annee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annee.component.html',
  styleUrls: ['./annee.component.css']
})
export class AnneeComponent implements OnInit {
  annees: Annee[] = [];
  selectedAnnee: Partial<Annee> = { id: undefined, code: '', libelle: '' };
  isEditMode = false;

  constructor(private anneeService: AnneeService) {}

  ngOnInit(): void {
    this.loadAnnees();
  }

  loadAnnees(): void {
    this.anneeService.getAll().subscribe({
      next: (annees) => this.annees = annees,
      error: (error) => {
        console.error('Erreur lors du chargement des années', error);
        this.showToast('Erreur de chargement', 'error');
      }
    });
  }

  openModal(annee?: Annee): void {
    if (annee) {
      this.isEditMode = true;
      this.selectedAnnee = { ...annee };
    } else {
      this.isEditMode = false;
      const anneeCourante = new Date().getFullYear();
      this.selectedAnnee = { id: anneeCourante, code: String(anneeCourante), libelle: 'Annee ' + anneeCourante };
    }
    $('#anneeModal').modal('show');
  }

  saveAnnee(): void {
    if (this.isEditMode && this.selectedAnnee.id) {
      this.anneeService.update(this.selectedAnnee.id, this.selectedAnnee)
        .subscribe({
          next: () => {
            this.loadAnnees();
            $('#anneeModal').modal('hide');
            this.showToast('Année modifiée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.anneeService.create(this.selectedAnnee)
        .subscribe({
          next: () => {
            this.loadAnnees();
            $('#anneeModal').modal('hide');
            this.showToast('Année créée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            const message = error?.error?.message || 'Erreur de création (année déjà existante ?)';
            this.showToast(message, 'error');
          }
        });
    }
  }

  deleteAnnee(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette année ?')) {
      this.anneeService.delete(id)
        .subscribe({
          next: () => {
            this.loadAnnees();
            this.showToast('Année supprimée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.showToast('Erreur de suppression', 'error');
          }
        });
    }
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
