import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';
import { RessourceService } from '../../service/Ressource.service';
import { Ressource, RessourceConsolidee, RessourceCreateRequest, TypeResource } from '../../model/ressource';

declare var $: any;

@Component({
  selector: 'app-ressource',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ressource.component.html',
  styleUrls: ['./ressource.component.css']
})
export class RessourceComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  debut: string = this.premierJourMois();
  fin: string = this.dernierJourMois();

  types: TypeResource[] = [];
  ressources: Ressource[] = [];
  consolidee: RessourceConsolidee | null = null;

  newRessource: RessourceCreateRequest = this.emptyRessource();
  newType: TypeResource = { code: '', libelle: '' };

  constructor(
    private boutiqueService: BoutiqueService,
    private ressourceService: RessourceService
  ) {}

  ngOnInit(): void {
    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
    this.ressourceService.getTypes().subscribe({
      next: (types) => this.types = types,
      error: (error) => console.error('Erreur lors du chargement des types', error)
    });
  }

  premierJourMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
  }

  dernierJourMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10);
  }

  emptyRessource(): RessourceCreateRequest {
    return {
      boutiqueId: this.boutiqueId || 0,
      typeResourceId: 0,
      montant: 0,
      dateRessource: new Date().toISOString().substring(0, 10),
      commentaire: ''
    };
  }

  charger(): void {
    if (!this.boutiqueId) {
      return;
    }
    this.ressourceService.getConsolide(this.boutiqueId, this.debut, this.fin).subscribe({
      next: (data) => {
        this.consolidee = data;
        this.ressources = data.ressourcesManuelles;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ressources', error);
        this.showToast('Erreur de chargement', 'error');
      }
    });
  }

  getTotal(): number {
    return this.consolidee?.total ?? 0;
  }

  openModal(): void {
    if (!this.boutiqueId) {
      this.showToast('Veuillez sélectionner une boutique', 'error');
      return;
    }
    this.newRessource = this.emptyRessource();
    $('#ressourceModal').modal('show');
  }

  save(): void {
    this.newRessource.boutiqueId = this.boutiqueId!;
    this.ressourceService.create(this.newRessource).subscribe({
      next: () => {
        this.charger();
        $('#ressourceModal').modal('hide');
        this.showToast('Ressource créée avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la création', error);
        this.showToast('Erreur de création', 'error');
      }
    });
  }

  delete(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      this.ressourceService.delete(id).subscribe({
        next: () => {
          this.charger();
          this.showToast('Ressource supprimée avec succès', 'success');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression', error);
          this.showToast('Erreur de suppression', 'error');
        }
      });
    }
  }

  openTypeModal(): void {
    this.newType = { code: '', libelle: '' };
    $('#typeResourceModal').modal('show');
  }

  saveType(): void {
    this.ressourceService.createType(this.newType).subscribe({
      next: (type) => {
        this.types.push(type);
        $('#typeResourceModal').modal('hide');
        this.showToast('Type créé avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la création du type', error);
        this.showToast('Erreur de création', 'error');
      }
    });
  }

  deleteType(id: number): void {
    if (confirm('Supprimer ce type de ressource ?')) {
      this.ressourceService.deleteType(id).subscribe({
        next: () => {
          this.types = this.types.filter(t => t.id !== id);
          this.showToast('Type supprimé avec succès', 'success');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du type', error);
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
