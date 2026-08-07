import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';
import { PhotocopieService } from '../../service/Photocopie.service';
import { Photocopie, PhotocopieSummary } from '../../model/photocopie';
import { AuthService } from '../../../auth/auth.service';

declare var $: any;

@Component({
  selector: 'app-photocopie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './photocopie.component.html',
  styleUrls: ['./photocopie.component.css']
})
export class PhotocopieComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  annee: number = new Date().getFullYear();
  username = '';

  photocopies: Photocopie[] = [];
  summary: PhotocopieSummary | null = null;
  selectedPhotocopie: Photocopie = this.emptyPhotocopie();
  isEditMode = false;

  currentPage = 0;
  pageSize = 15;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private boutiqueService: BoutiqueService,
    private photocopieService: PhotocopieService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUserFromStorage();
    this.username = user?.usersDTO?.userName || '';

    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
  }

  emptyPhotocopie(): Photocopie {
    return {
      libelle: '',
      montant: 0,
      dateReception: new Date().toISOString().substring(0, 10),
      boutiqueid: this.boutiqueId || 0,
      commentaire: ''
    };
  }

  charger(): void {
    if (!this.boutiqueId) {
      return;
    }
    this.photocopieService.findByMois(this.annee, this.boutiqueId, this.username, this.currentPage, this.pageSize)
      .subscribe({
        next: (page) => {
          this.photocopies = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des photocopies', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });

    this.photocopieService.getSummary(this.annee, this.boutiqueId, this.username)
      .subscribe({
        next: (summary) => this.summary = summary,
        error: (error) => console.error('Erreur lors du chargement du résumé', error)
      });
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.charger();
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i);
  }

  openModal(photocopie?: Photocopie): void {
    if (!this.boutiqueId) {
      this.showToast('Veuillez sélectionner une boutique', 'error');
      return;
    }
    if (photocopie) {
      this.isEditMode = true;
      this.selectedPhotocopie = { ...photocopie };
    } else {
      this.isEditMode = false;
      this.selectedPhotocopie = this.emptyPhotocopie();
    }
    $('#photocopieModal').modal('show');
  }

  savePhotocopie(): void {
    this.selectedPhotocopie.boutiqueid = this.boutiqueId!;
    this.selectedPhotocopie.username = this.username;

    if (this.isEditMode && this.selectedPhotocopie.id) {
      this.photocopieService.update(this.selectedPhotocopie.id, this.selectedPhotocopie)
        .subscribe({
          next: () => {
            this.charger();
            $('#photocopieModal').modal('hide');
            this.showToast('Photocopie modifiée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.photocopieService.create(this.selectedPhotocopie)
        .subscribe({
          next: () => {
            this.charger();
            $('#photocopieModal').modal('hide');
            this.showToast('Photocopie créée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deletePhotocopie(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      this.photocopieService.delete(id).subscribe({
        next: () => {
          this.charger();
          this.showToast('Photocopie supprimée avec succès', 'success');
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
