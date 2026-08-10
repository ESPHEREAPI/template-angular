import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BonAchat } from '../../model/bon-achat';
import { BonAchatService } from '../../service/BonAchat.service';
import { PrintService } from '../../service/print.service';

declare var $: any;

@Component({
  selector: 'app-bon-achat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bon-achat.component.html',
  styleUrls: ['./bon-achat.component.css']
})
export class BonAchatComponent implements OnInit {
  bonsAchat: BonAchat[] = [];
  selectedBonAchat: BonAchat = this.emptyBonAchat();
  isEditMode = false;
  impressionEnCours: number | null = null;

  constructor(private bonAchatService: BonAchatService, private printService: PrintService) {}

  ngOnInit(): void {
    this.loadBonsAchat();
  }

  emptyBonAchat(): BonAchat {
    return {
      codeBon: '',
      montantTotal: 0,
      montantUtilise: 0,
      dateExpiration: '',
      actif: true,
      clientBonAchat: { nom: '', telephone: '', email: '' }
    };
  }

  loadBonsAchat(): void {
    this.bonAchatService.getAll().subscribe({
      next: (data) => this.bonsAchat = data,
      error: (error) => {
        console.error('Erreur lors du chargement des bons d\'achat', error);
        this.showToast('Erreur de chargement', 'error');
      }
    });
  }

  openModal(bonAchat?: BonAchat): void {
    if (bonAchat) {
      this.isEditMode = true;
      this.selectedBonAchat = JSON.parse(JSON.stringify(bonAchat));
    } else {
      this.isEditMode = false;
      this.selectedBonAchat = this.emptyBonAchat();
    }
    $('#bonAchatModal').modal('show');
  }

  saveBonAchat(): void {
    if (this.isEditMode && this.selectedBonAchat.id) {
      this.bonAchatService.update(this.selectedBonAchat.id, this.selectedBonAchat)
        .subscribe({
          next: () => {
            this.loadBonsAchat();
            $('#bonAchatModal').modal('hide');
            this.showToast('Bon d\'achat modifié avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la modification', error);
            this.showToast('Erreur de modification', 'error');
          }
        });
    } else {
      this.bonAchatService.create(this.selectedBonAchat)
        .subscribe({
          next: () => {
            this.loadBonsAchat();
            $('#bonAchatModal').modal('hide');
            this.showToast('Bon d\'achat créé avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la création', error);
            this.showToast('Erreur de création', 'error');
          }
        });
    }
  }

  deleteBonAchat(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bon d\'achat ?')) {
      this.bonAchatService.delete(id).subscribe({
        next: () => {
          this.loadBonsAchat();
          this.showToast('Bon d\'achat supprimé avec succès', 'success');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression', error);
          this.showToast('Erreur de suppression', 'error');
        }
      });
    }
  }

  getSolde(bonAchat: BonAchat): number {
    return (bonAchat.montantTotal || 0) - (bonAchat.montantUtilise || 0);
  }

  // Genere le ticket PDF (avec code-barres) et l'imprime. Le backend marque
  // le bon comme imprime dans le meme appel - un bon deja imprime ne peut
  // plus l'etre a nouveau (voir BonAchatController#telechargerTicket).
  imprimerBon(bon: BonAchat): void {
    if (!bon.id || bon.imprime || this.impressionEnCours) return;
    this.impressionEnCours = bon.id;
    // Ouverture synchrone au clic - sinon le navigateur bloque le popup une
    // fois le PDF recupere de facon asynchrone.
    const fenetre = window.open('', '_blank');
    this.bonAchatService.telechargerTicket(bon.id).subscribe({
      next: (blob) => {
        this.printService.imprimerAvecPrevisualisation(blob, fenetre);
        bon.imprime = true;
        this.impressionEnCours = null;
      },
      error: (error) => {
        fenetre?.close();
        this.impressionEnCours = null;
        console.error('Erreur lors de l\'impression du bon d\'achat', error);
        this.showToast(error.error?.message || 'Erreur lors de l\'impression', 'error');
      }
    });
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
