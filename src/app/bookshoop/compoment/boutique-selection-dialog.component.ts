import { Component } from '@angular/core';
import { Boutique } from '../model/boutique';
import { BoutiqueService } from '../service/boutique.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-boutique-selection-dialog',
  standalone: true,
  imports: [ CommonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    ButtonModule],
  templateUrl: './boutique-selection-dialog.component.html',
  styleUrl: './boutique-selection-dialog.component.css'
})
export class BoutiqueSelectionDialogComponent {
visible: boolean = false;
  boutiques: Boutique[] = [];
  selectedBoutique: Boutique | null = null;
  loading: boolean = false;
  error: string = '';

  // Creation d'une premiere boutique (compte tout juste cree, aucune
  // boutique existante - voir loadBoutiques).
  creationMode: boolean = false;
  creating: boolean = false;
  nouvelleBoutique: Boutique = { code: '', nom: '' };

  // Callback à exécuter lors de la confirmation
  private onConfirmCallback: ((boutique: Boutique) => void) | null = null;

  constructor(
    private boutiqueService: BoutiqueService,
    private messageService: MessageService,
    private authService:AuthService
  ) {}

  ngOnInit(): void {
    // Le chargement se fera lors de l'ouverture du dialogue
  }

  /**
   * Ouvre le dialogue et charge les boutiques
   */
  open(callback: (boutique: Boutique) => void): void {
    this.onConfirmCallback = callback;
    this.visible = true;
    this.loadBoutiques();
  }

  /**
   * Charge la liste des boutiques depuis le serveur
   */
  private loadBoutiques(): void {
    this.loading = true;
    this.error = '';
    
    this.authService.getBoutiques().subscribe({
      next: (data: Boutique[]) => {
        this.boutiques = data;
        this.loading = false;

        // Si une seule boutique, la sélectionner automatiquement
        if (this.boutiques.length === 1) {
          this.selectedBoutique = this.boutiques[0];
        }

        // Aucune boutique existante (compte tout juste cree) - proposer
        // directement la creation plutot que de laisser un dropdown vide
        // sans issue.
        this.creationMode = this.boutiques.length === 0;

        console.log('[BoutiqueDialog] Boutiques chargées:', this.boutiques.length);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des boutiques. Veuillez réessayer.';
        console.error('[BoutiqueDialog] Erreur de chargement:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les boutiques'
        });
      }
    });
  }

  /**
   * Bascule vers le formulaire de creation d'une premiere boutique.
   */
  ouvrirCreation(): void {
    this.creationMode = true;
    this.error = '';
    this.nouvelleBoutique = { code: '', nom: '' };
  }

  annulerCreation(): void {
    this.creationMode = false;
    this.error = '';
  }

  /**
   * Cree la boutique saisie puis la selectionne automatiquement - evite un
   * aller-retour supplementaire pour l'admin qui vient de la creer.
   */
  creerBoutique(): void {
    if (!this.nouvelleBoutique.code || !this.nouvelleBoutique.nom) {
      return;
    }
    this.creating = true;
    this.error = '';

    this.boutiqueService.create(this.nouvelleBoutique).subscribe({
      next: (boutique) => {
        this.creating = false;
        this.boutiques.push(boutique);
        this.selectedBoutique = boutique;
        this.creationMode = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Boutique créée',
          detail: `"${boutique.nom}" a été créée avec succès.`
        });
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Erreur lors de la création de la boutique.';
        console.error('[BoutiqueDialog] Erreur de création:', err);
      }
    });
  }

  /**
   * Valide la sélection et ferme le dialogue
   */
  onConfirm(): void {
    if (this.selectedBoutique && this.onConfirmCallback) {
      console.log('[BoutiqueDialog] Boutique sélectionnée:', this.selectedBoutique);
      this.onConfirmCallback(this.selectedBoutique);
      this.close();
    }
  }

  /**
   * Ferme le dialogue et réinitialise l'état
   */
  private close(): void {
    this.visible = false;
    this.selectedBoutique = null;
    this.error = '';
    this.onConfirmCallback = null;
  }
}
