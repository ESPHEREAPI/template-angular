import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categorie } from '../../model/categorie';
import { CategorieService } from '../../service/Categorie.service';
import { MargeCibleService } from '../../service/MargeCible.service';
import { MargeCible, MargeCibleRequest } from '../../model/marge-cible';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';
import { MargeReelleService } from '../../service/MargeReelle.service';
import { MargeDetail } from '../../model/marge-detail';

declare var $: any;

@Component({
  selector: 'app-marge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marge.component.html',
  styleUrls: ['./marge.component.css']
})
export class MargeComponent implements OnInit {
  // Marge reelle (Ressources - Charges)
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  debut: string = this.premierJourMois();
  fin: string = this.dernierJourMois();
  detail: MargeDetail | null = null;

  // Configuration des marges cibles par categorie (inchange)
  categories: Categorie[] = [];
  marges: MargeCible[] = [];

  editingId: number | null = null;
  newMarge: MargeCibleRequest = this.emptyMarge();

  constructor(
    private categorieService: CategorieService,
    private margeCibleService: MargeCibleService,
    private boutiqueService: BoutiqueService,
    private margeReelleService: MargeReelleService
  ) {}

  ngOnInit(): void {
    this.categorieService.getAllSimple().subscribe({
      next: (categories) => this.categories = categories,
      error: (error) => console.error('Erreur lors du chargement des categories', error)
    });
    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
    this.charger();
  }

  premierJourMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
  }

  dernierJourMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10);
  }

  chargerMargeReelle(): void {
    if (!this.boutiqueId) {
      return;
    }
    this.margeReelleService.getDetail(this.boutiqueId, this.debut, this.fin).subscribe({
      next: (data) => this.detail = data,
      error: (error) => {
        console.error('Erreur lors du chargement de la marge', error);
        this.showToast('Erreur de chargement de la marge', 'error');
      }
    });
  }

  emptyMarge(): MargeCibleRequest {
    return { categorieId: 0, tauxCible: 0 };
  }

  charger(): void {
    this.margeCibleService.getAll().subscribe({
      next: (data) => this.marges = data,
      error: (error) => {
        console.error('Erreur lors du chargement des marges', error);
        this.showToast('Erreur de chargement', 'error');
      }
    });
  }

  categorieDejaConfiguree(categorieId: number): boolean {
    return this.marges.some(m => m.categorie?.id === categorieId);
  }

  openModal(): void {
    this.editingId = null;
    this.newMarge = this.emptyMarge();
    $('#margeModal').modal('show');
  }

  openEditModal(marge: MargeCible): void {
    this.editingId = marge.id!;
    this.newMarge = {
      categorieId: marge.categorie?.id || 0,
      tauxCible: marge.tauxCible
    };
    $('#margeModal').modal('show');
  }

  save(): void {
    if (!this.newMarge.categorieId) {
      this.showToast('Veuillez sélectionner une catégorie', 'error');
      return;
    }
    const request$ = this.editingId
      ? this.margeCibleService.update(this.editingId, this.newMarge)
      : this.margeCibleService.create(this.newMarge);

    request$.subscribe({
      next: () => {
        this.charger();
        $('#margeModal').modal('hide');
        this.showToast(this.editingId ? 'Marge mise à jour' : 'Marge créée avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement', error);
        this.showToast('Erreur d\'enregistrement', 'error');
      }
    });
  }

  delete(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration de marge ?')) {
      this.margeCibleService.delete(id).subscribe({
        next: () => {
          this.charger();
          this.showToast('Marge supprimée avec succès', 'success');
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
