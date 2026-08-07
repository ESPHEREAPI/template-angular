import { Component } from '@angular/core';
import { ModePaiement, ModePaiementLibelle } from '../../../enums/ModePaiement';
import { StatutVersement, StatutVersementColor, StatutVersementLibelle } from '../../../enums/StatutVersement';
import { VersementAnnulationRequest } from '../../../model/VersementAnnulationRequest';
import { VersementValidationRequest } from '../../../model/VersementValidationRequest';
import { Subject, takeUntil } from 'rxjs';
import { VersementService } from '../../../service/VersementService';
import { ActivatedRoute, Router } from '@angular/router';
import { VersementResponse } from '../../../model/VersementResponse';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-versement-detail',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './versement-detail.component.html',
  styleUrl: './versement-detail.component.css'
})
export class VersementDetailComponent {
versement?: VersementResponse;
  loading = false;
  versementId!: number;
  
  // Enums pour le template
  statutVersement = StatutVersement;
  statutLibelle = StatutVersementLibelle;
  statutColor = StatutVersementColor;
  modePaiementLibelle = ModePaiementLibelle;
  
  // Actions en cours
  validating = false;
  cancelling = false;
  downloadingRecu = false;

   username!: string;

    boutiqueid!: number;
    anneeid!: number;
  
  
  private destroy$ = new Subject<void>();

  constructor(
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
    this.versementId = +this.route.snapshot.params['id'];
    if (this.versementId) {
      this.loadVersement();
    } else {
      this.router.navigate(['/versements']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les détails du versement
   */
  loadVersement(): void {
    this.loading = true;
    this.versementService.getVersement(this.versementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (versement) => {
          this.versement = versement;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/versements']);
        }
      });
  }

  /**
   * Valide le versement
   */
  validerVersement(): void {
    if (!this.versement || !this.canValider()) {
      return;
    }

    if (confirm('Confirmer la validation de ce versement ? Cette action est irréversible.')) {
      this.validating = true;
      
      const request: VersementValidationRequest = {
        versementId: this.versementId,
        dateValidation: new Date(),
        username: this.username // TODO: Récupérer l'utilisateur connecté
      };

      this.versementService.validerVersement(this.versementId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.validating = false;
            this.loadVersement();
          },
          error: () => {
            this.validating = false;
          }
        });
    }
  }

  /**
   * Annule le versement
   */
  annulerVersement(): void {
    if (!this.versement || !this.canAnnuler()) {
      return;
    }

    const motif = prompt('Motif d\'annulation (obligatoire):');
    if (!motif || motif.trim() === '') {
      alert('Le motif d\'annulation est obligatoire');
      return;
    }

    if (confirm('Confirmer l\'annulation de ce versement ?')) {
      this.cancelling = true;
      
      const request: VersementAnnulationRequest = {
        versementId: this.versementId,
        motifAnnulation: motif,
        username: this.username // TODO: Récupérer l'utilisateur connecté
      };

      this.versementService.annulerVersement(this.versementId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cancelling = false;
            this.loadVersement();
          },
          error: () => {
            this.cancelling = false;
          }
        });
    }
  }

  /**
   * Télécharge le reçu de paiement
   */
  telechargerRecu(): void {
    this.downloadingRecu = true;
    this.versementService.telechargerRecuPaiement(this.versementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `recu-${this.versement?.numeroVersement}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.downloadingRecu = false;
        },
        error: () => {
          this.downloadingRecu = false;
        }
      });
  }

  /**
   * Imprime le reçu
   */
  printRecu(): void {
    window.print();
  }

  /**
   * Navigation vers la facture
   */
  viewFacture(): void {
    if (this.versement?.facture) {
      this.router.navigate(['/factures', this.versement.facture.id]);
    }
  }

  /**
   * Retour à la liste
   */
  backToList(): void {
    this.router.navigate(['/versements']);
  }

  /**
   * Vérifie si le versement peut être validé
   */
  canValider(): boolean {
    return this.versement?.statut === StatutVersement.EN_ATTENTE;
  }

  /**
   * Vérifie si le versement peut être annulé
   */
  canAnnuler(): boolean {
    return this.versement?.statut === StatutVersement.EN_ATTENTE || 
           this.versement?.statut === StatutVersement.VALIDE;
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(): string {
    return this.versement ? `badge badge-${this.statutColor[this.versement.statut as StatutVersement]}` : '';
  }

  /**
   * Retourne le libellé du statut
   */
  getStatutLibelle(): string {
    return this.versement ? this.statutLibelle[this.versement.statut as StatutVersement] : '';
  }

  /**
   * Retourne le libellé du mode de paiement
   */
  getModePaiementLibelle(): string {
    return this.versement ? this.modePaiementLibelle[this.versement.modePaiement] : '';
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
   * Retourne l'icône du mode de paiement
   */
  getModePaiementIcon(): string {
    if (!this.versement) return 'fas fa-money-bill-wave';
    
    switch (this.versement.modePaiement) {
      case ModePaiement.ESPECES:
        return 'fas fa-money-bill-wave';
      case ModePaiement.CHEQUE:
        return 'fas fa-money-check';
      case ModePaiement.VIREMENT:
        return 'fas fa-university';
      case ModePaiement.CARTE_BANCAIRE:
        return 'fas fa-credit-card';
      case ModePaiement.MOBILE_MONEY:
        return 'fas fa-mobile-alt';
      default:
        return 'fas fa-coins';
    }
  }

  /**
   * Retourne la couleur du statut pour les badges
   */
  getStatutColorClass(): string {
    if (!this.versement) return 'secondary';
    return this.statutColor[this.versement.statut as StatutVersement];
  }
}
