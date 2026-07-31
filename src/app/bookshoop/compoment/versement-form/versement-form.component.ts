// src/app/features/versements/pages/versement-form/versement-form.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Facture } from '../../model/facture';
import { ModePaiement, ModePaiementLibelle } from '../../enums/ModePaiement';
import { VersementService } from '../../service/VersementService';
import { FactureService } from '../../service/facture.service';
import { VersementCreateRequest } from '../../model/VersementCreateRequest';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';



@Component({
  selector: 'app-versement-form',
   standalone: true,
    imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './versement-form.component.html',
  styleUrls: ['./versement-form.component.css']
})
export class VersementFormComponent implements OnInit, OnDestroy {
  versementForm!: FormGroup;
  loading = false;
  submitting = false;
  
  // Données
  factures: Facture[] = [];
  factureSelectionnee?: Facture;
  
  // Options
  modePaiementOptions = Object.values(ModePaiement);
  modePaiementLibelle = ModePaiementLibelle;
  
  // Mode de paiement sélectionné
  selectedModePaiement?: ModePaiement;
  username!: string;

    boutiqueid!: number;
    anneeid!: number;
  
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private versementService: VersementService,
    private factureService: FactureService,
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
    this.initForm();
    this.loadFactures();
    this.setupFormListeners();
    
    // Vérifie si une facture est passée en paramètre
    const factureId = this.route.snapshot.queryParams['factureId'];
    if (factureId) {
      this.versementForm.patchValue({ factureId: +factureId });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire
   */
  initForm(): void {
    const today = new Date();

    this.versementForm = this.fb.group({
      factureId: [null, Validators.required],
      dateVersement: [today, Validators.required],
      montant: [0, [Validators.required, Validators.min(1)]],
      modePaiement: [null, Validators.required],
      referencePaiement: [''],
      banque: [''],
      numeroCompte: [''],
      remarques: ['']
    });
  }

  /**
   * Configure les listeners du formulaire
   */
  setupFormListeners(): void {
    // Écoute les changements de facture
    this.versementForm.get('factureId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(factureId => {
        this.onFactureSelect(factureId);
      });

    // Écoute les changements de mode de paiement
    this.versementForm.get('modePaiement')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.onModePaiementChange(mode);
      });
  }

  /**
   * Charge la liste des factures non soldées
   */
  loadFactures(): void {
    this.loading = true;
    // TODO: Filtrer les factures non soldées
    // Pour l'instant, charge toutes les factures
    this.factureService.listerFactures({
      statut: undefined,
      page: 0,
      size: 100
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.factures = response.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Sélection d'une facture
   */
  onFactureSelect(factureId: number): void {
    if (!factureId) {
      this.factureSelectionnee = undefined;
      return;
    }

    this.factureService.getFacture(factureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facture) => {
          this.factureSelectionnee = facture;
          
          // Prérempli le montant avec le solde restant
          if (facture.montantRestant > 0) {
            this.versementForm.patchValue({
              montant: facture.montantRestant
            });
          }
        }
      });
  }

  /**
   * Changement du mode de paiement
   */
  onModePaiementChange(mode: ModePaiement): void {
    this.selectedModePaiement = mode;
    
    // Rend la référence obligatoire pour certains modes
    const referenceControl = this.versementForm.get('referencePaiement');
    
    if (this.isReferenceObligatoire(mode)) {
      referenceControl?.setValidators([Validators.required]);
    } else {
      referenceControl?.clearValidators();
    }
    
    referenceControl?.updateValueAndValidity();
  }

  /**
   * Vérifie si la référence est obligatoire
   */
  isReferenceObligatoire(mode: ModePaiement): boolean {
    return mode === ModePaiement.CHEQUE || 
           mode === ModePaiement.VIREMENT || 
           mode === ModePaiement.MOBILE_MONEY;
  }

  /**
   * Vérifie si les champs bancaires sont affichés
   */
  showBanqueFields(): boolean {
    return this.selectedModePaiement === ModePaiement.CHEQUE || 
           this.selectedModePaiement === ModePaiement.VIREMENT;
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.versementForm.invalid) {
      this.markFormGroupTouched(this.versementForm);
      return;
    }

    // Valide que le montant ne dépasse pas le solde
    const montant = this.versementForm.get('montant')?.value;
    if (this.factureSelectionnee && montant > this.factureSelectionnee.montantRestant) {
      alert(`Le montant ne peut pas dépasser le solde restant de ${this.formatMontant(this.factureSelectionnee.montantRestant)}`);
      return;
    }

    this.submitting = true;
    const formValue = this.versementForm.value;

    const request: VersementCreateRequest = {
      factureId: formValue.factureId,
      dateVersement: formValue.dateVersement,
      montant: formValue.montant,
      modePaiement: formValue.modePaiement,
      referencePaiement: formValue.referencePaiement || undefined,
      banque: formValue.banque || undefined,
      numeroCompte: formValue.numeroCompte || undefined,
      remarques: formValue.remarques || undefined,
      username: this.username // TODO: Récupérer l'utilisateur connecté
    };

    this.versementService.creerVersement(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.router.navigate(['/versements', response.id]);
        },
        error: () => {
          this.submitting = false;
        }
      });
  }

  /**
   * Annulation
   */
  onCancel(): void {
    this.router.navigate(['/versements']);
  }

  /**
   * Marque tous les champs comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Formate un montant
   */
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' XAF';
  }

  /**
   * Retourne le libellé du mode de paiement
   */
  getModePaiementLibelle(mode: ModePaiement): string {
    return this.modePaiementLibelle[mode];
  }

  /**
   * Calcule le pourcentage payé
   */
  getPourcentagePaye(): number {
    if (!this.factureSelectionnee || this.factureSelectionnee.montantTTC === 0) {
      return 0;
    }
    return (this.factureSelectionnee.montantPaye / this.factureSelectionnee.montantTTC) * 100;
  }
}