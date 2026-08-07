import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BonAchat } from '../../model/bon-achat';
import { BonAchatService } from '../../service/BonAchat.service';

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

  constructor(private bonAchatService: BonAchatService) {}

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
