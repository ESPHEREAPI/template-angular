import { Component } from '@angular/core';
import { StatutFacture } from '../../../enums/StatutFacture';
import { Subject, takeUntil } from 'rxjs';
import { FactureAnnulationRequest } from '../../../model/FactureAnnulationRequest';
import { FactureValidationRequest } from '../../../model/FactureValidationRequest';
import { FactureService } from '../../../service/facture.service';
import { VersementService } from '../../../service/VersementService';
import { ActivatedRoute, Router } from '@angular/router';
import { StatutFactureColor, StatutFactureLibelle } from '../../../enums/ModePaiement';
import { VersementResponse } from '../../../model/VersementResponse';
import { Facture } from '../../../model/facture';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [CommonModule,FormsModule,],
  templateUrl: './facture-detail.component.html',
  styleUrl: './facture-detail.component.css'
})
export class FactureDetailComponent {
facture?: Facture;
  versements: VersementResponse[] = [];
  loading = false;
  factureId!: number;
  
  // Enums pour le template
  statutFacture = StatutFacture;
  statutLibelle = StatutFactureLibelle;
  statutColor = StatutFactureColor;

  username!: string;

    boutiqueid!: number;
    anneeid!: number;
  
  // Actions en cours
  validating = false;
  cancelling = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private factureService: FactureService,
    private versementService: VersementService,
    private route: ActivatedRoute,
    private router: Router,
    private autheService:AuthService
  ) { }

  ngOnInit(): void {
    // Charger les informations utilisateur
    const user = this.autheService.getUserFromStorage();
    if (user) {
      this.username = user.usersDTO.userName;
      this.boutiqueid = user.usersDTO.boutiqueid ?? 0;
      this.anneeid = user.anneeid ?? 0;
    }
    this.factureId = +this.route.snapshot.params['id'];
    if (this.factureId) {
      console.log("factureid",this.factureId)
      this.loadFacture();
      this.loadVersements();
    } else {
      this.router.navigate(['/factures']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les détails de la facture
   */
  loadFacture(): void {
    this.loading = true;
    this.factureService.getFacture(this.factureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facture) => {
          this.facture = facture;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/factures']);
        }
      });
  }

  /**
   * Charge les versements de la facture
   */
  loadVersements(): void {
    this.versementService.getVersementsFacture(this.factureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (versements) => {
          this.versements = versements;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des versements:', error);
        }
      });
  }

  /**
   * Valide la facture
   */
  validerFacture(): void {
    if (!this.facture || !this.canValider()) {
      return;
    }

    if (confirm('Confirmer la validation de cette facture ? Cette action effectuera la sortie de stock.')) {
      this.validating = true;
      
      const request: FactureValidationRequest = {
        factureId: this.factureId,
        dateValidation: new Date(),
        username: this.username // TODO: Récupérer l'utilisateur connecté
      };

      this.factureService.validerFacture(this.factureId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.validating = false;
            this.loadFacture();
          },
          error: () => {
            this.validating = false;
          }
        });
    }
  }

  /**
   * Annule la facture
   */
  annulerFacture(): void {
    if (!this.facture || !this.canAnnuler()) {
      return;
    }

    const motif = prompt('Motif d\'annulation (obligatoire):');
    if (!motif || motif.trim() === '') {
      alert('Le motif d\'annulation est obligatoire');
      return;
    }

    if (confirm('Confirmer l\'annulation de cette facture ? Le stock sera réintégré.')) {
      this.cancelling = true;
      
      const request: FactureAnnulationRequest = {
        factureId: this.factureId,
        motifAnnulation: motif,
        username: this.username // TODO: Récupérer l'utilisateur connecté
      };

      this.factureService.annulerFacture(this.factureId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cancelling = false;
            this.loadFacture();
          },
          error: () => {
            this.cancelling = false;
          }
        });
    }
  }

  /**
   * Navigation vers l'édition
   */
  editFacture(): void {
    this.router.navigate(['/factures', this.factureId, 'edit']);
  }

  /**
   * Navigation vers la création de versement
   */
  createVersement(): void {
    this.router.navigate(['/versements/create'], {
      queryParams: { factureId: this.factureId }
    });
  }

  /**
   * Retour à la liste
   */
  backToList(): void {
    this.router.navigate(['/factures']);
  }

  /**
   * Imprime la facture
   */
  printFacture(): void {
   // Afficher un message de chargement
  const loadingMessage = document.createElement('div');
  loadingMessage.innerText = '⏳ Génération du PDF en cours...';
  loadingMessage.style.position = 'fixed';
  loadingMessage.style.top = '20px';
  loadingMessage.style.right = '20px';
  loadingMessage.style.background = '#333';
  loadingMessage.style.color = '#fff';
  loadingMessage.style.padding = '10px 20px';
  loadingMessage.style.borderRadius = '8px';
  loadingMessage.style.fontSize = '14px';
  loadingMessage.style.zIndex = '10000';
  loadingMessage.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  document.body.appendChild(loadingMessage);

  this.factureService.genererPDF(this.factureId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (blob) => {
        // Masquer le message de chargement
        document.body.removeChild(loadingMessage);

        // Créer une URL temporaire pour le PDF
        const fileURL = URL.createObjectURL(blob);

        // ✅ Ouvrir le PDF dans un nouvel onglet
        const newWindow = window.open(fileURL, '_blank');

        if (newWindow) {
          // Attendre que le PDF soit complètement chargé avant d’imprimer
          newWindow.onload = () => {
            newWindow.focus();

            // Délai pour laisser le PDF s’afficher avant l’impression
            setTimeout(() => {
              newWindow.print();
              // ⚠️ On ne ferme PAS l’onglet : l’utilisateur décide quand le faire
            }, 1000);
          };
        } else {
          alert('Veuillez autoriser les pop-ups pour afficher le PDF.');
        }
      },
      error: (err) => {
        document.body.removeChild(loadingMessage);
        console.error('Erreur lors de la génération du PDF :', err);
        alert('❌ Une erreur est survenue lors de la génération du PDF.');
      }
    });
  }

  /**
   * Exporte en PDF
   */
  exportPDF(): void {
    this.factureService.genererPDF(this.factureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `facture-${this.facture?.numeroFacture}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      });
  }

  /**
   * Envoie la facture par email
   */
  sendByEmail(): void {
    if (!this.facture || !this.facture.client.email) {
      alert('Le client n\'a pas d\'adresse email');
      return;
    }

    if (confirm(`Envoyer la facture à ${this.facture.client.email} ?`)) {
      this.factureService.envoyerParEmail(this.factureId, this.facture.client.email)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  /**
   * Vérifie si la facture peut être validée
   */
  canValider(): boolean {
    return this.facture?.statut === StatutFacture.BROUILLON;
  }

  /**
   * Vérifie si la facture peut être modifiée
   */
  canEdit(): boolean {
    return this.facture?.statut === StatutFacture.BROUILLON;
  }

  /**
   * Vérifie si la facture peut être annulée
   */
  canAnnuler(): boolean {
    return this.facture?.statut !== StatutFacture.ANNULEE && 
           this.facture?.statut !== StatutFacture.BROUILLON;
  }

  /**
   * Vérifie si on peut créer un versement
   */
  canCreateVersement(): boolean {
    return this.facture?.statut === StatutFacture.NON_PAYEE || 
           this.facture?.statut === StatutFacture.PARTIELLEMENT_PAYEE ||
           this.facture?.statut === StatutFacture.EN_RETARD;
  }

  /**
   * Vérifie si la facture est en retard
   */
  isEnRetard(): boolean {
    return this.facture?.statut === StatutFacture.EN_RETARD ||
           (this.facture?.joursRetard !== undefined && this.facture.joursRetard > 0);
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(): string {
    return this.facture ? `badge badge-${this.statutColor[this.facture.statut]}` : '';
  }

  /**
   * Retourne le libellé du statut
   */
  getStatutLibelle(): string {
    return this.facture ? this.statutLibelle[this.facture.statut] : '';
  }

  /**
   * Formate un montant
   */
  formatMontant(montant?: number): string {
    if (montant === undefined) return '0 XAF';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' XAF';
  }

  /**
   * Calcule le pourcentage payé
   */
  getPourcentagePaye(): number {
    if (!this.facture || this.facture.montantTTC === 0) {
      return 0;
    }
    return (this.facture.montantPaye / this.facture.montantTTC) * 100;
  }

  /**
   * Retourne la couleur de la progress bar
   */
  getProgressBarColor(): string {
    const pourcentage = this.getPourcentagePaye();
    if (pourcentage >= 100) return 'success';
    if (pourcentage >= 50) return 'info';
    if (pourcentage >= 25) return 'warning';
    return 'danger';
  }
}
