import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';


import { DevisService } from '../../service/devis.service';
import { ClientService } from '../../service/client.service';
import { AuthService } from '../../../auth/auth.service';
import { Devis } from '../../model/devis';
import { Client } from '../../model/client';

/**
 * ============================================================================
 * COMPOSANT DE LISTE DES DEVIS
 * ============================================================================
 * 
 * Ce composant gère l'affichage, la recherche, le filtrage et les actions
 * sur la liste des devis.
 * 
 * FONCTIONNALITÉS PRINCIPALES:
 * =============================
 * 
 * 1. AFFICHAGE
 *    - Liste paginée des devis
 *    - Statistiques en temps réel
 *    - Indicateurs visuels (badges, couleurs)
 * 
 * 2. RECHERCHE ET FILTRAGE
 *    - Recherche textuelle avec debounce
 *    - Filtre par client
 *    - Filtre par statut
 *    - Filtre par période
 * 
 * 3. ACTIONS SUR LES DEVIS
 *    - Créer un nouveau devis
 *    - Voir les détails
 *    - Éditer (EN_ATTENTE uniquement)
 *    - Accepter/Refuser
 *    - Dupliquer
 *    - Télécharger PDF
 *    - Supprimer (EN_ATTENTE uniquement)
 * 
 * 4. ALERTES
 *    - Détection des devis expirés
 *    - Calcul automatique des statistiques
 * 
 * @author Votre Équipe
 * @version 2.0
 * @since Angular 18
 */

@Component({
  selector: 'app-devis-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './devis-list.component.html',
  styleUrl: './devis-list.component.css'
})
export class DevisListComponent implements OnInit, OnDestroy {
  
  // ========================================================================
  // PROPRIÉTÉS
  // ========================================================================
  
  /**
   * Liste complète des devis chargée depuis le backend
   */
  devisList: Devis[] = [];
  
  /**
   * Liste filtrée des devis (après application des filtres et recherche)
   */
  devisFiltres: Devis[] = [];
  
  /**
   * Liste des clients pour le filtre dropdown
   */
  clients: Client[] = [];
  
  /**
   * Formulaire réactif pour les filtres
   */
  filtresForm: FormGroup;
  
  /**
   * Référence à Math pour utilisation dans le template
   */
  Math = Math;
   username!: string;
    boutiqueid!: number;
  anneeid!: number;
  
  /**
   * Indicateurs de chargement
   */
  chargement = false;           // Chargement d'une action
  chargementInitial = true;     // Chargement initial de la page
  
  /**
   * Configuration de la pagination
   */
  pageCourante = 1;             // Page actuelle (commence à 1)
  itemsParPage = 10;            // Nombre d'items par page
  
  /**
   * Terme de recherche textuelle
   */
  recherche = '';
  
  /**
   * Statistiques calculées en temps réel
   */
  statistiques = {
    total: 0,                   // Nombre total de devis
    enAttente: 0,               // Devis EN_ATTENTE
    acceptes: 0,                // Devis ACCEPTE
    refuses: 0,                 // Devis REFUSE
    expires: 0,                 // Devis expirés
    convertis: 0,               // Devis CONVERTI
    annules: 0,                 // Devis ANNULE
    montantTotal: 0             // Montant total de tous les devis
  };

  /**
   * Subject pour la gestion de la destruction du composant
   * Évite les fuites mémoire en annulant les subscriptions
   */
  private destroy$ = new Subject<void>();
  
  /**
   * Subject pour la recherche avec debounce
   * Évite trop d'appels lors de la saisie
   */
  private recherche$ = new Subject<string>();

  // ========================================================================
  // CONSTRUCTEUR ET INJECTION DE DÉPENDANCES
  // ========================================================================
  
  constructor(
    private fb: FormBuilder,
    private devisService: DevisService,
    private clientService: ClientService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
     private autheService: AuthService,
  ) {
    // Initialisation du formulaire de filtres
    this.filtresForm = this.fb.group({
      clientId: [''],     // ID du client sélectionné
      statut: [''],       // Statut sélectionné
      dateFrom: [''],     // Date de début
      dateTo: ['']        // Date de fin
    });
  }

  // ========================================================================
  // CYCLE DE VIE DU COMPOSANT
  // ========================================================================

  /**
   * Initialisation du composant
   * Appelé automatiquement par Angular après la création du composant
   */
  ngOnInit(): void {
    // Charger les informations utilisateur
    const user = this.autheService.getUserFromStorage();
    if (user) {
      this.username = user.usersDTO.userName;
      this.boutiqueid = user.usersDTO.boutiqueid ?? 0;
      this.anneeid = user.anneeid ?? 0;
    }
    console.log('🚀 Initialisation du composant DevisListComponent');
    this.initialiserComposant();
  }

  /**
   * Destruction du composant
   * Appelé automatiquement par Angular avant la destruction du composant
   * Permet de nettoyer les ressources et éviter les fuites mémoire
   */
  ngOnDestroy(): void {
    console.log('🛑 Destruction du composant DevisListComponent');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================================================
  // INITIALISATION
  // ========================================================================

  /**
   * INITIALISATION COMPLÈTE DU COMPOSANT
   * =====================================
   * 
   * Configure tous les observables et charge les données initiales:
   * 1. Configuration de la recherche avec debounce (300ms)
   * 2. Écoute des changements de filtres
   * 3. Chargement des données (clients + devis)
   */
  private initialiserComposant(): void {
    // 1. Configuration de la recherche avec debounce
    // Attend 300ms après la dernière frappe avant de lancer la recherche
    this.recherche$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('🔍 Recherche déclenchée:', this.recherche);
        this.appliquerFiltres();
        this.cdr.markForCheck();
      });

    // 2. Écoute des changements de filtres
    // À chaque changement, les filtres sont automatiquement appliqués
    this.filtresForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔧 Filtres modifiés:', this.filtresForm.value);
        this.appliquerFiltres();
        this.cdr.markForCheck();
      });

    // 3. Chargement initial des données
    this.chargerDonneesInitiales();
  }

  /**
   * CHARGEMENT INITIAL DES DONNÉES
   * ===============================
   * 
   * Charge en parallèle les clients et les devis.
   * Utilise Promise.all pour optimiser les performances.
   */
  private chargerDonneesInitiales(): void {
    this.chargementInitial = true;
    this.cdr.markForCheck();

    console.log('📦 Chargement des données initiales...');

    // Charger clients et devis en parallèle
    Promise.all([
      this.chargerClients(),
      this.chargerDevis()
    ]).finally(() => {
      this.chargementInitial = false;
      this.cdr.markForCheck();
      console.log('✓ Données initiales chargées');
    });
  }

  // ========================================================================
  // CHARGEMENT DES DONNÉES
  // ========================================================================

  /**
   * CHARGER LA LISTE DES CLIENTS
   * =============================
   * 
   * Charge tous les clients pour le filtre dropdown.
   * 
   * @returns Promise résolue quand le chargement est terminé
   */
  private chargerClients(): Promise<void> {
    return new Promise((resolve) => {
      console.log('👥 Chargement des clients...');
      
      this.clientService.listClients()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.clients = data;
            console.log(`✓ ${data.length} client(s) chargé(s)`);
            this.cdr.markForCheck();
            resolve();
          },
          error: (err) => {
            console.error('❌ Erreur chargement clients:', err);
            this.toastr.error('Impossible de charger la liste des clients', 'Erreur');
            resolve(); // Résoudre quand même pour ne pas bloquer
          }
        });
    });
  }

  /**
   * CHARGER LA LISTE DES DEVIS
   * ===========================
   * 
   * Charge tous les devis depuis le backend, calcule les statistiques
   * et applique les filtres.
   * 
   * @returns Promise résolue quand le chargement est terminé
   */
  chargerDevis(): Promise<void> {
    return new Promise((resolve) => {
      this.chargement = true;
      this.cdr.markForCheck();

      console.log('📄 Chargement des devis...');

      this.devisService.findAll()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.chargement = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (data) => {
            this.devisList = data;
            console.log(`✓ ${data.length} devis chargé(s)`);
             console.log('list devis',this.devisList);
            
            // Calculer les statistiques
            this.calculerStatistiques();
            
            // Appliquer les filtres
            this.appliquerFiltres();
            
            this.cdr.markForCheck();
            
            // Message de succès
            if (data.length > 0) {
              this.toastr.success(
                `${data.length} devis chargé(s)`,
                'Données actualisées',
                { timeOut: 2000, progressBar: true }
              );
            } else {
              this.toastr.info('Aucun devis disponible', 'Information');
            }
            
            resolve();
          },
          error: (err) => {
            console.error('❌ Erreur chargement devis:', err);
            const message = this.devisService.getErrorMessage(err);
            this.toastr.error(message, 'Erreur de chargement', {
              timeOut: 5000,
              closeButton: true
            });
            resolve(); // Résoudre quand même
          }
        });
    });
  }

  // ========================================================================
  // STATISTIQUES
  // ========================================================================

  /**
   * CALCULER LES STATISTIQUES
   * ==========================
   * 
   * Calcule en temps réel les statistiques sur les devis:
   * - Nombre total
   * - Répartition par statut
   * - Nombre de devis expirés
   * - Montant total
   */
  calculerStatistiques(): void {
    console.log('📊 Calcul des statistiques...');
    
    this.statistiques = {
      total: this.devisList.length,
      enAttente: this.devisList.filter(d => d.statut === 'EN_ATTENTE').length,
      acceptes: this.devisList.filter(d => d.statut === 'ACCEPTE').length,
      refuses: this.devisList.filter(d => d.statut === 'REFUSE').length,
      convertis: this.devisList.filter(d => d.statut === 'CONVERTI').length,
      annules: this.devisList.filter(d => d.statut === 'ANNULE').length,
      expires: this.devisList.filter(d => this.isExpired(d)).length,
      montantTotal: this.devisList.reduce((sum, d) => sum + (d.total || 0), 0)
    };
    
    console.log('✓ Statistiques calculées:', this.statistiques);
  }

  // ========================================================================
  // FILTRAGE ET RECHERCHE
  // ========================================================================

  /**
   * APPLIQUER LES FILTRES
   * ======================
   * 
   * Applique tous les filtres actifs sur la liste des devis:
   * - Recherche textuelle
   * - Filtre par client
   * - Filtre par statut
   * - Filtre par période
   * 
   * La recherche textuelle cherche dans:
   * - Nom du client
   * - Code du client
   * - Téléphone du client
   * - Numéro du devis
   */
  appliquerFiltres(): void {
    console.log('🔧 Application des filtres...');
    
    let filtres = [...this.devisList];
    const filtresValues = this.filtresForm.value;

    // 1. RECHERCHE TEXTUELLE
    if (this.recherche?.trim()) {
      const terme = this.recherche.toLowerCase();
      console.log('  → Recherche:', terme);
      
      filtres = filtres.filter(d =>
        d.client?.nom?.toLowerCase().includes(terme) ||
        d.client?.code?.toLowerCase().includes(terme) ||
        d.client?.telephone?.toLowerCase().includes(terme) ||
        d.numeroDevis?.toLowerCase().includes(terme) ||
        `DV-${d.id}`.toLowerCase().includes(terme)
      );
    }

    // 2. FILTRE PAR CLIENT
    if (filtresValues.clientId) {
      console.log('  → Filtre client:', filtresValues.clientId);
      filtres = filtres.filter(d => d.client?.id === +filtresValues.clientId);
    }

    // 3. FILTRE PAR STATUT
    if (filtresValues.statut) {
      console.log('  → Filtre statut:', filtresValues.statut);
      filtres = filtres.filter(d => d.statut === filtresValues.statut);
    }

    // 4. FILTRE PAR DATE DE DÉBUT
    if (filtresValues.dateFrom) {
      const dateFrom = new Date(filtresValues.dateFrom);
      console.log('  → Date de début:', dateFrom.toLocaleDateString());
      filtres = filtres.filter(d => new Date(d.dateDevis) >= dateFrom);
    }

    // 5. FILTRE PAR DATE DE FIN
    if (filtresValues.dateTo) {
      const dateTo = new Date(filtresValues.dateTo);
      dateTo.setHours(23, 59, 59, 999); // Inclure toute la journée
      console.log('  → Date de fin:', dateTo.toLocaleDateString());
      filtres = filtres.filter(d => new Date(d.dateDevis) <= dateTo);
    }

    this.devisFiltres = filtres;
    this.pageCourante = 1; // Retour à la première page
    
    console.log(`✓ ${filtres.length} devis après filtrage`);
  }

  /**
   * RECHERCHE AVEC DEBOUNCE
   * ========================
   * 
   * Déclenche une recherche avec délai (debounce).
   * Évite les recherches multiples lors de la frappe rapide.
   * 
   * @param terme - Terme de recherche saisi
   */
  rechercherDevis(terme: string): void {
    this.recherche$.next(terme);
  }

  /**
   * RÉINITIALISER LES FILTRES
   * ==========================
   * 
   * Remet tous les filtres à leur valeur par défaut.
   */
  reinitialiserFiltres(): void {
    console.log('🔄 Réinitialisation des filtres');
    
    this.filtresForm.reset({
      clientId: '',
      statut: '',
      dateFrom: '',
      dateTo: ''
    });
    
    this.recherche = '';
    this.appliquerFiltres();
    
    this.toastr.info('Filtres réinitialisés', 'Information', {
      timeOut: 2000,
      positionClass: 'toast-top-right'
    });
    
    this.cdr.markForCheck();
  }

  // ========================================================================
  // PAGINATION
  // ========================================================================

  /**
   * OBTENIR LES DEVIS DE LA PAGE COURANTE
   * ======================================
   * 
   * Retourne uniquement les devis de la page active.
   * Utilise slice() pour extraire la portion de la liste.
   * 
   * @returns Tableau des devis à afficher sur la page
   */
  obtenirDevisPage(): Devis[] {
    const debut = (this.pageCourante - 1) * this.itemsParPage;
    const fin = debut + this.itemsParPage;
    return this.devisFiltres.slice(debut, fin);
  }

  /**
   * OBTENIR LE NOMBRE TOTAL DE PAGES
   * =================================
   * 
   * Calcule le nombre de pages nécessaires pour afficher
   * tous les devis filtrés.
   * 
   * @returns Nombre total de pages
   */
  obtenirTotalPages(): number {
    return Math.ceil(this.devisFiltres.length / this.itemsParPage);
  }

  /**
   * CHANGER DE PAGE
   * ===============
   * 
   * @param page - Numéro de la page à afficher
   */
  allerALaPage(page: number): void {
    if (page >= 1 && page <= this.obtenirTotalPages()) {
      this.pageCourante = page;
      this.cdr.markForCheck();
    }
  }

  // ========================================================================
  // NAVIGATION
  // ========================================================================

  /**
   * CRÉER UN NOUVEAU DEVIS
   * ======================
   * 
   * Redirige vers le formulaire de création de devis.
   */
  creerNouveauDevis(): void {
    console.log('➕ Navigation vers création de devis');
    this.router.navigate(['/devis/nouveau']);
  }

  /**
   * VOIR LES DÉTAILS D'UN DEVIS
   * ============================
   * 
   * Redirige vers la page de détails du devis.
   * 
   * @param devisId - ID du devis
   */
  voirDetails(devisId: number): void {
    console.log(`👁️ Navigation vers détails devis ${devisId}`);
    this.router.navigate(['/devis', devisId, 'detail']);
  }

  /**
   * ÉDITER UN DEVIS
   * ===============
   * 
   * Redirige vers le formulaire d'édition du devis.
   * Note: Seuls les devis EN_ATTENTE peuvent être édités.
   * 
   * @param devisId - ID du devis
   */
  editerDevis(devisId: number): void {
    console.log(`✏️ Navigation vers édition devis ${devisId}`);
    this.router.navigate(['/devis', devisId, 'edit']);
  }

  // ========================================================================
  // ACTIONS SUR LES DEVIS
  // ========================================================================

  /**
   * ACCEPTER UN DEVIS
   * =================
   * 
   * Change le statut du devis en ACCEPTE.
   * Demande confirmation avant l'action.
   * 
   * @param devisId - ID du devis à accepter
   */
  accepterDevis(devisId: number): void {
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir accepter ce devis ?')) {
      return;
    }

    console.log(`✅ Acceptation du devis ${devisId}`);
    this.chargement = true;
    this.cdr.markForCheck();

    this.devisService.accepterDevis(devisId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargement = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Devis accepté avec succès';
          console.log('✓', message);
          
          this.toastr.success(message, 'Succès', {
            timeOut: 3000,
            progressBar: true,
            positionClass: 'toast-top-right'
          });
          
          // Recharger la liste
          this.chargerDevis();
        },
        error: (err) => {
          console.error('❌ Erreur acceptation:', err);
          const message = this.devisService.getErrorMessage(err);
          this.toastr.error(message, 'Erreur', {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right'
          });
        }
      });
  }

  /**
   * REFUSER UN DEVIS
   * ================
   * 
   * Change le statut du devis en REFUSE.
   * Demande confirmation avant l'action.
   * 
   * @param devisId - ID du devis à refuser
   */
  refuserDevis(devisId: number): void {
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) {
      return;
    }

    console.log(`❌ Refus du devis ${devisId}`);
    this.chargement = true;
    this.cdr.markForCheck();

    this.devisService.refuserDevis(devisId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargement = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Devis refusé';
          console.log('✓', message);
          
          this.toastr.warning(message, 'Devis refusé', {
            timeOut: 3000,
            progressBar: true,
            positionClass: 'toast-top-right'
          });
          
          // Recharger la liste
          this.chargerDevis();
        },
        error: (err) => {
          console.error('❌ Erreur refus:', err);
          const message = this.devisService.getErrorMessage(err);
          this.toastr.error(message, 'Erreur', {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right'
          });
        }
      });
  }

  /**
   * ANNULER UN DEVIS
   * ================
   * 
   * Annule un devis (statut ANNULE).
   * Demande le motif d'annulation.
   * 
   * @param devisId - ID du devis à annuler
   */
  annulerDevis(devisId: number): void {
    // Demander le motif d'annulation
    const motif = prompt('Veuillez indiquer le motif d\'annulation:');
    
    if (!motif || motif.trim() === '') {
      this.toastr.warning('Le motif d\'annulation est requis', 'Attention');
      return;
    }

    console.log(`🚫 Annulation du devis ${devisId}`);
    this.chargement = true;
    this.cdr.markForCheck();

    this.devisService.annulerDevis(devisId, motif)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargement = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Devis annulé';
          console.log('✓', message);
          
          this.toastr.info(message, 'Devis annulé', {
            timeOut: 3000,
            progressBar: true,
            positionClass: 'toast-top-right'
          });
          
          // Recharger la liste
          this.chargerDevis();
        },
        error: (err) => {
          console.error('❌ Erreur annulation:', err);
          const message = this.devisService.getErrorMessage(err);
          this.toastr.error(message, 'Erreur', {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right'
          });
        }
      });
  }

  /**
   * DUPLIQUER UN DEVIS
   * ==================
   * 
   * Crée une copie du devis avec un nouveau numéro.
   * 
   * @param devisId - ID du devis à dupliquer
   */
  dupliquerDevis(devisId: number): void {
    console.log(`📋 Duplication du devis ${devisId}`);
    this.chargement = true;
    this.cdr.markForCheck();

    this.devisService.dupliquerDevis(devisId,this.username)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargement = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Devis dupliqué avec succès';
          console.log('✓', message);
          
          this.toastr.success(message, 'Succès', {
            timeOut: 3000,
            progressBar: true,
            positionClass: 'toast-top-right'
          });
          
          // Recharger la liste
          this.chargerDevis();
        },
        error: (err) => {
          console.error('❌ Erreur duplication:', err);
          const message = this.devisService.getErrorMessage(err);
          this.toastr.error(message, 'Erreur de duplication', {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right'
          });
        }
      });
  }

  /**
   * TÉLÉCHARGER LE PDF D'UN DEVIS
   * ==============================
   * 
   * Génère et télécharge le PDF du devis.
   * 
   * @param devisId - ID du devis
   */
  telechargerPdf(devisId: number): void {
    console.log(`📄 Génération PDF devis ${devisId}`);
    
    this.toastr.info('Génération du PDF en cours...', 'Veuillez patienter', {
      timeOut: 2000,
      positionClass: 'toast-top-right'
    });

    this.devisService.genererPdf(devisId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✓ PDF téléchargé');
          this.toastr.success('PDF téléchargé avec succès', 'Succès', {
            timeOut: 3000,
            progressBar: true,
            positionClass: 'toast-top-right'
          });
        },
        error: (err) => {
          console.error('❌ Erreur génération PDF:', err);
          const message = this.devisService.getErrorMessage(err);
          this.toastr.error(message, 'Erreur de téléchargement', {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right'
          });
        }
      });
  }

  /**
   * CONFIRMER ET SUPPRIMER UN DEVIS
   * ================================
   * 
   * Supprime définitivement un devis.
   * Demande confirmation car l'action est irréversible.
   * 
   * @param devisId - ID du devis à supprimer
   */
  confirmerSuppression(devisId: number): void {
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce devis ? Cette action est irréversible.')) {
      return;
    }

    console.log(`🗑️ Suppression du devis ${devisId}`);
    this.chargement = true;
    this.cdr.markForCheck();

    this.devisService.supprimerDevis(devisId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargement = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Devis supprimé avec succès';
          console.log('✓', message);
          
          this.toastr.success(message, 'Suppression réussie', {
            timeOut: 3000,
            progressBar: true,
            positionClass: 'toast-top-right'
          });
          
          // Recharger la liste
          this.chargerDevis();
        },
        error: (err) => {
          console.error('❌ Erreur suppression:', err);
          const message = this.devisService.getErrorMessage(err);
          this.toastr.error(message, 'Erreur de suppression', {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-right'
          });
        }
      });
  }

  // ========================================================================
  // UTILITAIRES DE STYLE ET AFFICHAGE
  // ========================================================================

  /**
   * VÉRIFIER SI UN DEVIS EST EXPIRÉ
   * ================================
   * 
   * Un devis est considéré comme expiré si:
   * - Il a une date d'expiration
   * - La date d'expiration est passée
   * - Son statut est encore EN_ATTENTE
   * 
   * @param devis - Devis à vérifier
   * @returns true si le devis est expiré
   */
  isExpired(devis: Devis): boolean {
    if (!devis?.dateExpiration) return false;
    
    const dateExp = new Date(devis.dateExpiration);
    const maintenant = new Date();
    
    return dateExp < maintenant && devis.statut === 'EN_ATTENTE';
  }

  /**
   * OBTENIR LA CLASSE CSS POUR UNE LIGNE
   * =====================================
   * 
   * Retourne la classe Bootstrap appropriée selon le statut.
   * 
   * @param devis - Devis concerné
   * @returns Classe CSS à appliquer
   */
  getRowClass(devis: Devis): string {
    if (devis.statut === 'ACCEPTE' || devis.statut === 'CONVERTI') {
      return 'table-success'; // Vert
    }
    if (devis.statut === 'REFUSE') {
      return 'table-danger'; // Rouge
    }
    if (devis.statut === 'ANNULE') {
      return 'table-warning'; // Jaune
    }
    if (this.isExpired(devis)) {
      return 'table-secondary'; // Gris
    }
    return '';
  }

  /**
   * OBTENIR LA CLASSE BADGE POUR UN STATUT
   * =======================================
   * 
   * Retourne la classe AdminLTE pour le badge de statut.
   * 
   * @param statut - Statut du devis
   * @returns Classe CSS du badge
   */
  getStatutBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'badge-warning',    // Jaune
      'ACCEPTE': 'badge-info',          // Bleu
      'REFUSE': 'badge-danger',         // Rouge
      'CONVERTI': 'badge-success',      // Vert
      'ANNULE': 'badge-secondary',      // Gris
      'EXPIRE': 'badge-dark'            // Noir
    };
    return classes[statut] || 'badge-primary';
  }

  /**
   * OBTENIR L'ICÔNE POUR UN STATUT
   * ===============================
   * 
   * Retourne l'icône FontAwesome appropriée.
   * 
   * @param statut - Statut du devis
   * @returns Classe CSS de l'icône
   */
  getStatutIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'EN_ATTENTE': 'fa-hourglass-half',    // Sablier
      'ACCEPTE': 'fa-check-circle',         // Check
      'REFUSE': 'fa-times-circle',          // Croix
      'CONVERTI': 'fa-file-invoice',        // Facture
      'ANNULE': 'fa-ban',                   // Interdiction
      'EXPIRE': 'fa-calendar-times'         // Calendrier barré
    };
    return icons[statut] || 'fa-info-circle';
  }

  /**
   * FORMATER UN MONTANT EN MONNAIE
   * ===============================
   * 
   * Formate un nombre en montant monétaire.
   * 
   * @param montant - Montant à formater
   * @returns Chaîne formatée
   */
  formaterMontant(montant: number): string {
    if (!montant) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  }

  /**
   * OBTENIR LE LIBELLÉ DU STATUT
   * =============================
   * 
   * Retourne une version lisible du statut.
   * 
   * @param statut - Code du statut
   * @returns Libellé formaté
   */
  getStatutLibelle(statut: string): string {
    const libelles: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ACCEPTE': 'Accepté',
      'REFUSE': 'Refusé',
      'CONVERTI': 'Converti',
      'ANNULE': 'Annulé',
      'EXPIRE': 'Expiré'
    };
    return libelles[statut] || statut;
  }
}