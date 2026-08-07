import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';
import { ChargeService } from '../../service/Charge.service';
import { Charge, ChargeCreateRequest, TypeDepense } from '../../model/charge';

declare var $: any;

@Component({
  selector: 'app-charge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './charge.component.html',
  styleUrls: ['./charge.component.css']
})
export class ChargeComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  debut: string = this.premierJourMois();
  fin: string = this.dernierJourMois();

  types: TypeDepense[] = [];
  charges: Charge[] = [];

  newCharge: ChargeCreateRequest = this.emptyCharge();
  newType: TypeDepense = { code: '', libelle: '' };

  constructor(
    private boutiqueService: BoutiqueService,
    private chargeService: ChargeService
  ) {}

  ngOnInit(): void {
    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
    this.chargeService.getTypes().subscribe({
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

  emptyCharge(): ChargeCreateRequest {
    return {
      boutiqueId: this.boutiqueId || 0,
      typeDepenseId: 0,
      montant: 0,
      dateCharge: new Date().toISOString().substring(0, 10),
      commentaire: ''
    };
  }

  charger(): void {
    if (!this.boutiqueId) {
      return;
    }
    this.chargeService.getByBoutiqueAndPeriode(this.boutiqueId, this.debut, this.fin).subscribe({
      next: (data) => this.charges = data,
      error: (error) => {
        console.error('Erreur lors du chargement des charges', error);
        this.showToast('Erreur de chargement', 'error');
      }
    });
  }

  getTotal(): number {
    return this.charges.reduce((sum, c) => sum + (c.montant || 0), 0);
  }

  openModal(): void {
    if (!this.boutiqueId) {
      this.showToast('Veuillez sélectionner une boutique', 'error');
      return;
    }
    this.newCharge = this.emptyCharge();
    $('#chargeModal').modal('show');
  }

  save(): void {
    this.newCharge.boutiqueId = this.boutiqueId!;
    this.chargeService.create(this.newCharge).subscribe({
      next: () => {
        this.charger();
        $('#chargeModal').modal('hide');
        this.showToast('Charge créée avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la création', error);
        this.showToast('Erreur de création', 'error');
      }
    });
  }

  delete(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) {
      this.chargeService.delete(id).subscribe({
        next: () => {
          this.charger();
          this.showToast('Charge supprimée avec succès', 'success');
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
    $('#typeDepenseModal').modal('show');
  }

  saveType(): void {
    this.chargeService.createType(this.newType).subscribe({
      next: (type) => {
        this.types.push(type);
        $('#typeDepenseModal').modal('hide');
        this.showToast('Type créé avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la création du type', error);
        this.showToast('Erreur de création', 'error');
      }
    });
  }

  deleteType(id: number): void {
    if (confirm('Supprimer ce type de dépense ?')) {
      this.chargeService.deleteType(id).subscribe({
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
