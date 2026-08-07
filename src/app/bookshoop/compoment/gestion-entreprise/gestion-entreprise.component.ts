import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Entreprise } from '../../model/Entreprise';
import { Annee } from '../../model/annee';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { ReferenceDataService } from '../../service/reference-data.service';
import { ToastrService } from 'ngx-toastr';
import { EntrepriseService } from '../../service/Entreprise.service';
import { EntrepriseRequest } from '../../model/EntrepriseRequest';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-entreprise',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gestion-entreprise.component.html',
  styleUrl: './gestion-entreprise.component.css'
})
export class GestionEntrepriseComponent  implements OnInit, OnDestroy {

 

  // Formulaire
  formulaire: FormGroup;

  // Données
  entreprises: Entreprise[] = [];
  entreprisesFiltrees: Entreprise[] = [];
  annees: Annee[] = [];

  // État
  modeEdition: boolean = false;
  entrepriseSelectionnee: Entreprise | null = null;
  
  // Chargement
  chargement: boolean = false;
  chargementForm: boolean = false;
  soumission: boolean = false;

  // Recherche
  termRecherche: string = '';
  filtreAnnee: number | null = null;
  filtreActif: boolean | null = null;

  // Modal suppression
  afficherModalSuppression: boolean = false;
  entrepriseASupprimer: Entreprise | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private entrepriseService: EntrepriseService,
    private referenceDataService: ReferenceDataService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.formulaire = this.fb.group({
      anneeId: ['', Validators.required],
      directeur: ['', [Validators.maxLength(50)]],
      activite: ['', [Validators.required, Validators.maxLength(50)]],
      conventionCollective: ['', [Validators.required, Validators.maxLength(50)]],
      siteWeb: ['', [Validators.maxLength(200)]],
      actif: [true, Validators.required],
      typeResponsable: ['', [Validators.maxLength(200)]],
      dateCreation: ['', Validators.required],
      dateFinLicense: ['']
    });
  }

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les données de référence et les entreprises
   */
  chargerDonnees(): void {
    this.chargement = true;

    forkJoin({
      entreprises: this.entrepriseService.findAll(),
      annees: this.referenceDataService.getAnnees()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.entreprises = data.entreprises;
          this.entreprisesFiltrees = [...this.entreprises];
          this.annees = data.annees;

          console.log('✅ Données chargées:', {
            entreprises: this.entreprises.length,
            annees: this.annees.length
          });

          this.chargement = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Erreur chargement données:', err);
          this.toastr.error('Erreur lors du chargement des données');
          this.chargement = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Soumet le formulaire (création ou modification)
   */
  soumettre(): void {
    if (!this.formulaire.valid) {
      this.toastr.warning('Veuillez remplir tous les champs requis');
      Object.keys(this.formulaire.controls).forEach(key => {
        this.formulaire.get(key)?.markAsTouched();
      });
      return;
    }

    this.soumission = true;

    const request: EntrepriseRequest = this.formulaire.value;

    const operation = this.modeEdition && this.entrepriseSelectionnee
      ? this.entrepriseService.update(this.entrepriseSelectionnee.anneeId, request)
      : this.entrepriseService.create(request);

    operation.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.soumission = false;
          
          const message = this.modeEdition 
            ? 'Entreprise modifiée avec succès' 
            : 'Entreprise créée avec succès';
          
          this.toastr.success(message);
          
          this.reinitialiser();
          this.chargerDonnees();
        },
        error: (error) => {
          this.soumission = false;
          console.error('❌ Erreur:', error);
          
          const message = error.error?.error || 'Une erreur s\'est produite';
          this.toastr.error(message);
          
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Prépare le formulaire pour l'édition
   */
  editer(entreprise: Entreprise): void {
    this.modeEdition = true;
    this.entrepriseSelectionnee = entreprise;

    this.formulaire.patchValue({
      anneeId: entreprise.anneeId,
      directeur: entreprise.directeur,
      activite: entreprise.activite,
      conventionCollective: entreprise.conventionCollective,
      siteWeb: entreprise.siteWeb,
      actif: entreprise.actif,
      typeResponsable: entreprise.typeResponsable,
      dateCreation: entreprise.dateCreation,
      dateFinLicense: entreprise.dateFinLicense
    });

    // Désactiver la modification de la clé composite
    this.formulaire.get('anneeId')?.disable();

    // Scroll vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Ouvre le modal de confirmation de suppression
   */
  confirmerSuppression(entreprise: Entreprise): void {
    this.entrepriseASupprimer = entreprise;
    this.afficherModalSuppression = true;
  }

  /**
   * Supprime une entreprise
   */
  supprimer(): void {
    if (!this.entrepriseASupprimer) return;

    const { anneeId } = this.entrepriseASupprimer;

    this.entrepriseService.delete(anneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Entreprise supprimée avec succès');
          this.afficherModalSuppression = false;
          this.entrepriseASupprimer = null;
          this.chargerDonnees();
        },
        error: (error) => {
          console.error('❌ Erreur suppression:', error);
          const message = error.error?.error || 'Erreur lors de la suppression';
          this.toastr.error(message);
          this.afficherModalSuppression = false;
        }
      });
  }

  /**
   * Active une entreprise par défaut
   */
  activerParDefaut(entreprise: Entreprise): void {
    if (entreprise.actif) {
      this.toastr.info('Cette entreprise est déjà active');
      return;
    }

    this.entrepriseService.activerParDefaut(entreprise.anneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Entreprise activée avec succès');
          this.chargerDonnees();
        },
        error: (error) => {
          console.error('❌ Erreur activation:', error);
          const message = error.error?.error || 'Erreur lors de l\'activation';
          this.toastr.error(message);
        }
      });
  }

  /**
   * Réinitialise le formulaire
   */
  reinitialiser(): void {
    this.formulaire.reset({
      actif: true,
      dateCreation: new Date().toISOString().split('T')[0]
    });
    
    this.modeEdition = false;
    this.entrepriseSelectionnee = null;

    // Réactiver le champ de clé composite
    this.formulaire.get('anneeId')?.enable();
  }

  /**
   * Applique les filtres de recherche
   */
  appliquerFiltres(): void {
    this.entreprisesFiltrees = this.entreprises.filter(entreprise => {
      // Filtre par année
      if (this.filtreAnnee && entreprise.anneeId !== this.filtreAnnee) {
        return false;
      }

      // Filtre par statut actif
      if (this.filtreActif !== null && entreprise.actif !== this.filtreActif) {
        return false;
      }

      // Filtre par terme de recherche
      if (this.termRecherche) {
        const terme = this.termRecherche.toLowerCase();
        return (
          entreprise.directeur?.toLowerCase().includes(terme) ||
          entreprise.activite?.toLowerCase().includes(terme)
        );
      }

      return true;
    });
  }

  /**
   * Réinitialise les filtres
   */
  reinitialiserFiltres(): void {
    this.termRecherche = '';
    this.filtreAnnee = null;
    this.filtreActif = null;
    this.entreprisesFiltrees = [...this.entreprises];
  }

  /**
   * Récupère le libellé d'une année
   */
  getAnneeLibelle(anneeId: number): string {
    const annee = this.annees.find(a => a.id === anneeId);
    return annee ? `${annee.code} - ${annee.libelle}` : '-';
  }

  /**
   * Vérifie si un champ est invalide
   */
  estChampInvalide(nomChamp: string): boolean {
    const champ = this.formulaire.get(nomChamp);
    return !!(champ && champ.invalid && champ.touched);
  }
}

