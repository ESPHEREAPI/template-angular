import { ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, delay, distinctUntilChanged, finalize, Subject, take, takeUntil } from 'rxjs';
import { Commande } from '../../model/commande';
import { PrixArticles } from '../../model/prix-articles';
import { Produit } from '../../model/produit';
import { Categorie } from '../../model/categorie';
import { Depot } from '../../model/depot';
import { Magasin } from '../../model/Magasin';
import { MagasinService } from '../../service/Magasin.service';
import { MagasinFournisseurService } from '../../service/MagasinFournisseur.service';
import { CommandeService } from '../../service/commande.service';
import { ProduitService } from '../../service/produit.service';
import { PrixArticlesService } from '../../service/prix-articles.service';
import { ReferenceDataService } from '../../service/reference-data.service';
import { NotificationService } from '../../service/notification.service';
import { PaginationResponse } from '../../model/pagination-response';
import { CommonModule } from '@angular/common';
import { ContentHeaderComponent } from '../../../content-header/content-header.component';
import { UserService } from '../../service/user-service.service';
import { ListesProduitsComponent } from '../listes-produits/listes-produits.component';
import { AuthService } from '../../../auth/auth.service';

type AlertType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-command',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ContentHeaderComponent, ListesProduitsComponent],
  templateUrl: './command.component.html',
  styleUrl: './command.component.css'
})
export class CommandComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Page configuration
  pageTitle: string = 'Approvisionnement';
  breadcrumbItems = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Approvisionnement', active: true }
  ];
  // ✅ Flag de protection
  isCreatingProduct = false;
  //✅ AJOUTEZ CES PROPRIÉTÉS
  isProcessing = false;
  private lastCallTime = 0;
  // Forms
  commandeForm!: FormGroup;
  produitForm!: FormGroup;
  readonly Math = Math;

  // Pricing
  prixAchat: number = 0;
  prixVente: number = 0;

  // Data collections
  commandes: Commande[] = [];
  prixArticles: PrixArticles[] = [];
  produits: Produit[] = [];
  selectedArticle: Produit | null = null;
  categories: Categorie[] = [];
  depots: Depot[] = [];
  // Magasins de la compagnie (points de vente + depots) - le choix du
  // magasin destination determine seul la liste des fournisseurs proposes,
  // plus besoin de la case a cocher "Depot destination".
  magasins: Magasin[] = [];
  // Magasin selectionne pour la liste "Prix Articles" en bas de page - par
  // defaut celui de la boutique de l'utilisateur, mais consultable pour
  // n'importe quel magasin/depot de la compagnie.
  selectedMagasinId: number | null = null;

  // UI State
  isLoading = false;
  showProduitModal = false;
  editingIndex = -1;
  selectedProduit: Produit | null = null;
  currentStock = 0;
  isCreatingNewProduct = false;

  // Alert system
  alertMessage: string = '';
  alertType: AlertType = 'info';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  pageSizeOptions = [5, 10, 20, 50, 100, 500, 1000];
  boutiqueid:number=0;

  // Search
  searchTerm = '';
  filteredPrixArticles: PrixArticles[] = [];

  constructor(
    private fb: FormBuilder,
    public commandeService: CommandeService,
    private produitService: ProduitService,
    private prixArticlesService: PrixArticlesService,
    private referenceDataService: ReferenceDataService,
    private notificationService: NotificationService,
    private userService: UserService,
    private magasinService: MagasinService,
    private magasinFournisseurService: MagasinFournisseurService,
    private cdr: ChangeDetectorRef ,// ✅ AJOUT DU ChangeDetectorRef,
    private autService:AuthService
  ) {
    this.initializeForms();
  }


  ngOnInit(): void {
    this.boutiqueid=this.autService.getBoutiqueByUserSession();
    this.setupProduitsSubscription(); // ✅ Configurer l'abonnement AVANT de charger

    this.loadInitialData();

    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  // ✅ NOUVELLE MÉTHODE : S'abonner aux changements de produits
  // ✅ SUBSCRIPTION AUX PRODUITS - ABSOLUMENT CRITIQUE
  // ✅ MÉTHODE CORRIGÉE avec vérifications de sécurité
  // ✅ SUBSCRIPTION AUX PRODUITS - ABSOLUMENT CRITIQUE
  private setupProduitsSubscription(): void {
    console.log('🔧 Configuration de la subscription aux produits...');

    this.produitService.produits$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits) => {
          console.log('📦 RECEPTION DE NOUVEAUX PRODUITS:', produits.length);
          console.log('📋 Liste complète:', produits.map(p => p.libelle).join(', '));

          // ✅ Créer une NOUVELLE référence du tableau
          this.produits = [...produits];

          // ✅ Forcer la détection de changements
          this.cdr.detectChanges();

          console.log('✅ Produits assignés au composant:', this.produits.length);
        },
        error: (error) => {
          console.error('❌ Erreur subscription produits:', error);
        }
      });
  }

  // ==================== INITIALIZATION ====================

  private initializeForms(): void {
    this.commandeForm = this.fb.group({
      dateReception: [
        new Date().toISOString().substring(0, 10),
        [Validators.required, this.dateNotInPastValidator()]
      ],
      numeroRepartition: [''],
      barcode: ['']
    });

    this.produitForm = this.fb.group({
      produit: [null],
      reference: [''],
      libelle: ['', Validators.required],
      categories: [null, Validators.required],
      magasinDestination: [null, Validators.required],
      depot: [null, Validators.required],
      prixVenteModifiable: [false],
      pacquets: [false],
      quantiteByPacquet: [1]
    });
  }

  private loadInitialData(): void {
    this.showLoading('Chargement des données...');

    // Load categories
    this.referenceDataService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          console.log('✅ Catégories chargées:', categories.length);
        },
        error: (error) => this.handleError('Erreur lors du chargement des catégories', error)
      });

    // Load magasins (destination) - remplace l'ancien chargement direct des depots
    this.loadMagasins();

    // ✅ Load products
    console.log('🔄 Chargement initial des produits...');
    this.produitService.getProduitsAutoComplet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Chargement initial terminé');
          this.hideLoading();
        },
        error: (error) => {
          console.error('❌ Erreur chargement initial:', error);
          this.handleError('Erreur lors du chargement des produits', error);
        }
      });

    // Load commands and prices
    this.loadCommandes();
    this.loadPrixArticles();
  }

  private setupFormSubscriptions(): void {
    // Barcode subscription
    this.commandeForm.get('barcode')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(barcode => {
        if (barcode && barcode.length >= 8) {
          this.searchProductByBarcode(barcode);
        }
      });

    // Product selection subscription
    this.produitForm.get('produit')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(produit => {
        if (produit) {
          this.onProduitSelected(produit);
        }
      });

    // Magasin destination subscription - determine seul la liste des
    // fournisseurs proposes (associations dediees + fournisseurs
    // "disponible partout"), plus de case a cocher separee a synchroniser.
    this.produitForm.get('magasinDestination')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((magasin: Magasin | null) => {
        this.produitForm.get('depot')?.setValue(null);
        if (magasin?.id) {
          this.loadFournisseursPourMagasin(magasin);
        } else {
          this.depots = [];
        }
      });

    // Depot selection subscription for stock calculation
    this.produitForm.get('depot')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(depot => {
        if (depot && this.selectedProduit) {
          this.calculateCurrentStock(depot);
        }
      });

    // Reference validation for new products
    this.produitForm.get('reference')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(reference => {
        if (this.isCreatingNewProduct && reference) {
          this.validateReference(reference);
        }
      });
  }

  // ==================== DATA LOADING ====================

  /** Tous les magasins de la compagnie (points de vente + depots), pour le choix de la destination. */
  loadMagasins(): void {
    this.magasinService.getAll(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.magasins = response.content;
          // Par defaut, on affiche la liste du magasin lie a la boutique de
          // l'utilisateur ; a defaut le premier magasin de la compagnie.
          const magasinBoutique = this.magasins.find(m => m.boutique?.id === this.boutiqueid);
          this.selectedMagasinId = magasinBoutique?.id ?? this.magasins[0]?.id ?? null;
          this.loadPrixArticles(0);
        },
        error: (error) => this.handleError('Erreur lors du chargement des magasins', error)
      });
  }

  onMagasinFilterChange(magasinId: number | string): void {
    this.selectedMagasinId = Number(magasinId);
    this.currentPage = 0;
    this.loadPrixArticles(0);
  }

  /**
   * Fournisseurs disponibles pour le magasin choisi (associations dediees +
   * fournisseurs "disponible partout"). Reconstruit des paires Depot
   * (magasin + fournisseur) pour rester compatible avec le formulaire et la
   * soumission existants (depot.id / depot.fournisseur.id).
   */
  loadFournisseursPourMagasin(magasin: Magasin): void {
    this.magasinFournisseurService.getDisponiblesPourMagasin(magasin.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fournisseurs) => {
          this.depots = fournisseurs.map(f => ({
            id: magasin.id!,
            code: magasin.code,
            libelle: magasin.libelle,
            boutique: magasin.boutique ?? null,
            fournisseur: f,
            actif: true
          }));
        },
        error: (error) => this.handleError('Erreur lors du chargement des fournisseurs', error)
      });
  }

  private loadCommandes(): void {
    this.commandeService.getCommandes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commandes) => {
          this.commandes = commandes;
          this.commandeService.updateLocalCommandes(commandes);
        },
        error: (error) => this.handleError('Erreur lors du chargement des commandes', error)
      });
  }

  private loadPrixArticles(page: number = 0): void {
    const source$ = this.selectedMagasinId
      ? this.prixArticlesService.getPrixArticlesByMagasin(this.selectedMagasinId, page, this.pageSize, this.searchTerm)
      : this.prixArticlesService.getPrixArticles(page, this.pageSize, this.searchTerm);
    source$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginationResponse<PrixArticles>) => {
          this.prixArticles = response.content;
          this.filteredPrixArticles = response.content;
          this.totalElements = response.totalElements;
          this.currentPage = response.page;
          this.hideLoading();
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des prix articles', error);
        }
      });
  }

  // ==================== PRODUCT MANAGEMENT ====================

  ajoutArticle(): void {
    this.resetProduitForm();
    this.commandes = [];
    this.isCreatingNewProduct = false;
    this.showProduitModal = true;
    this.showAlert('Veuillez sélectionner ou créer un article', 'info');
  }

  toggleCreateNewProduct(): void {
    this.isCreatingNewProduct = !this.isCreatingNewProduct;

    if (this.isCreatingNewProduct) {
      // Enable and require reference for new products
      this.produitForm.get('reference')?.enable();
      this.produitForm.get('reference')?.setValidators([Validators.required]);
      this.produitForm.get('reference')?.updateValueAndValidity();
      this.selectedArticle = null;
      this.showAlert('Mode création activé. Remplissez tous les champs requis.', 'warning');
    } else {
      // Make reference readonly for existing products
      this.produitForm.get('reference')?.clearValidators();
      this.produitForm.get('reference')?.updateValueAndValidity();
      this.showAlert('Mode sélection activé', 'info');
    }
  }

  onArticleSelected(article: Produit): void {
    this.selectedArticle = article;
    if (article) {
      this.onProduitSelected(article);
      this.showAlert(`Article sélectionné: ${article.libelle}`, 'success');
    }
  }

  onProduitSelected(produit: Produit): void {
    this.selectedProduit = produit;

    this.produitForm.patchValue({
      reference: produit.reference,
      libelle: produit.libelle,
      prixVenteModifiable: produit.prixVenteModifiable,
      pacquets: produit.pacquets,
      quantiteByPacquet: produit.quantiteByPacquet
    });

    if (produit.categories) {
      const selectedCategorie = this.categories.find(cat => cat.id === produit.categories?.id);
      this.produitForm.get('categories')?.setValue(selectedCategorie);
    }
  }

  searchProductByBarcode(barcode: string): void {
    this.showLoading('Recherche du produit...');

    this.produitService.getProduitByBarcode(barcode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produit) => {
          this.selectedProduit = produit;
          this.onProduitSelected(produit);
          this.hideLoading();
          this.showAlert(`Produit trouvé: ${produit.libelle}`, 'success');
        },
        error: (error) => {
          this.hideLoading();
          this.showAlert('Produit non trouvé pour ce code-barres', 'warning');
        }
      });
  }

  validateReference(reference: string): void {
    this.produitService.checkReferenceExists(reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          if (exists) {
            this.produitForm.get('reference')?.setErrors({ alreadyExists: true });
            this.showAlert('Cette référence existe déjà', 'error');
          }
        },
        error: (error) => console.error('Erreur lors de la validation de la référence', error)
      });
  }

  // 1️⃣ CORRECTION DE LA MÉTHODE chargerPrix() - Ligne ~399
  chargerPrix(): void {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    console.log('═══════════════════════════════════');
    console.log('🔵 chargerPrix() appelé');
    console.log('⏱️ Délai depuis dernier appel:', timeSinceLastCall + 'ms');
    console.log('🔒 isProcessing:', this.isProcessing);
    console.log('⏳ isLoading:', this.isLoading);

    // ✅ PROTECTION RENFORCÉE
    if (this.isProcessing || this.isLoading) {
      console.error('❌ APPEL BLOQUÉ - Traitement déjà en cours');
      return;
    }

    // ✅ Protection temporelle
    if (timeSinceLastCall < 2000) {
      console.error('❌ APPEL BLOQUÉ - Trop rapide (< 2s)');
      return;
    }

    // ✅ VERROUILLAGE IMMÉDIAT avant toute autre opération
    this.isProcessing = true;
    this.isLoading = true;
    this.lastCallTime = now;

    if (this.isCreatingNewProduct) {
      console.log('➡️ Mode CRÉATION');
      this.createNewProductAndAddToCommand();
    } else {
      console.log('➡️ Mode SÉLECTION');
      this.addExistingProductToCommand();
    }
  }
  // ✅ MÉTHODE OPTIMISÉE DE CRÉATION
  // ✅ MÉTHODE CORRIGÉE pour la création de produit


  // 2️⃣ CORRECTION DE createNewProductAndAddToCommand() - Ligne ~434
  private createNewProductAndAddToCommand(): void {
    console.log('───────────────────────────────────');
    console.log('🆕 createNewProductAndAddToCommand() START');

    // ✅ Vérification du formulaire
    if (this.produitForm.invalid) {
      console.warn('⚠️ Formulaire invalide');
      this.showAlert('Veuillez remplir tous les champs requis', 'error');
      this.markFormGroupTouched(this.produitForm);
      // ✅ DÉVERROUILLAGE en cas d'erreur
      this.isProcessing = false;
      this.isLoading = false;
      return;
    }

    const username = this.userService.getUserConnected();
    const newProduct: Produit = {
      ...this.produitForm.value,
      username: username.username,
      deletes: false
    };

    console.log('📤 Envoi API - Référence:', newProduct.reference);

    this.produitService.createProduit(newProduct)
      .pipe(
        take(1), // ✅ NE PRENDRE QUE LA PREMIÈRE ÉMISSION
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🔓 DÉVERROUILLAGE dans finalize()');
          // ✅ TOUJOURS déverrouiller, même en cas d'erreur
          this.isProcessing = false;
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ SUCCESS - Réponse API:', response);

          // ✅ VÉRIFICATION RENFORCÉE de response.data
          if (!response || !response.data) {
            console.error('❌ Réponse invalide:', response);
            this.showAlert('Erreur: Réponse du serveur invalide', 'error');
            return;
          }

          console.log('🎉 Produit créé - ID:', response.data.id);

          this.selectedProduit = response.data;
          this.selectedArticle = response.data;

          // ✅ Recharger la liste puis ajouter à la commande
          console.log('🔄 Rechargement de la liste...');
          this.produitService.getProduitsAutoComplet(true)
            .pipe(
              take(1),
              takeUntil(this.destroy$)
            )
            .subscribe({
              next: () => {
                console.log('✅ Liste rechargée - Total:', this.produits.length);
                this.showAlert(
                  `✅ Produit "${response.data.libelle}" créé avec succès!`,
                  'success'
                );
                // ✅ Ajouter à la commande SEULEMENT si le rechargement réussit
                this.loadPricesAndAddToCommand(response.data);
              },
              error: (err) => {
                console.error('⚠️ Erreur rechargement (non critique):', err);
                this.showAlert('Produit créé, mais erreur lors du rechargement de la liste', 'warning');
                // ✅ Ajouter quand même à la commande
                this.loadPricesAndAddToCommand(response.data);
              }
            });
        },
        error: (error) => {
          console.error('❌ ERROR - Erreur API:', error);
          console.error('❌ Détails:', {
            status: error.status,
            message: error.error?.message || error.message,
            error: error.error
          });

          let errorMessage = 'Erreur lors de la création du produit';

          // ✅ Gestion des erreurs spécifiques
          if (error.status === 409 || error.error?.message?.includes('existe')) {
            errorMessage = 'Ce produit existe déjà. Veuillez utiliser un autre nom ou référence.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.showAlert(errorMessage, 'error');
        }
      });
  }

  // ✅ Méthode pour forcer le rechargement si nécessaire
  // ✅ MÉTHODE POUR FORCER LE RECHARGEMENT

  // ✅ MÉTHODE POUR FORCER LE RECHARGEMENT
  refreshProduit(): void {
    console.log('🔄 Rafraîchissement manuel déclenché...');
    this.showLoading('Actualisation de la liste des produits...');

    // Forcer le rechargement
    this.produitService.getProduitsAutoComplet(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Rafraîchissement terminé');
          this.hideLoading();
          this.showAlert('Liste des produits actualisée', 'success');
          this.loadPrixArticles();
        },
        error: (error) => {
          console.error('❌ Erreur rafraîchissement:', error);
          this.hideLoading();
          this.handleError('Erreur lors de l\'actualisation', error);
        }
      });
  }
  // 3️⃣ CORRECTION DE addExistingProductToCommand() - Ligne ~554
  private addExistingProductToCommand(): void {
    const produitFormValid = this.produitForm.valid;
    const produit = this.selectedProduit;

    if (!produitFormValid || !produit?.id) {
      this.showAlert('Veuillez sélectionner un produit valide', 'error');
      // ✅ DÉVERROUILLAGE en cas d'erreur
      this.isProcessing = false;
      this.isLoading = false;
      return;
    }

    this.loadPricesAndAddToCommand(produit);
  }

// 4️⃣ CORRECTION DE loadPricesAndAddToCommand() - Ligne ~566
private loadPricesAndAddToCommand(produit: Produit): void {
  if (!produit || !produit.id) {
    console.error('❌ Produit invalide dans loadPricesAndAddToCommand');
    this.showAlert('Erreur: Produit invalide', 'error');
    this.isProcessing = false;
    this.isLoading = false;
    return;
  }

  this.showLoading('Chargement des prix...');

  this.produitService.getPrixProduit(produit.id)
    .pipe(
      take(1), // ✅ Prendre seulement la première émission
      takeUntil(this.destroy$),
      finalize(() => {
        // ✅ S'assurer que le chargement est terminé
        this.hideLoading();
      })
    )
    .subscribe({
      next: (data) => {
        console.log('✅ Prix récupérés:', data);
        this.prixAchat = data.prixAchat;
        this.prixVente = data.prixVente;
        this.chargeCommandeTable();
        this.showAlert('Prix chargés avec succès', 'success');
      },
      error: (err) => {
        console.error('❌ Erreur chargement prix:', err);
        this.handleError('Erreur lors de la récupération des prix', err);
      }
    });
}


  chargeCommandeTable(): void {
    const { depot } = this.produitForm.value;
    const { dateReception, numeroRepartition, barcode } = this.commandeForm.value;
    const produit = this.selectedProduit;

    if (!produit?.id) return;

    const nouvelleCommande: Commande = {
      dateReception,
      numeroRepartition,
      quantite: 0,
      prixAchat: this.prixAchat,
      prixVente: this.prixVente,
      depotid: depot.id,
      fournisseurid: depot.fournisseur.id,
      produitid: produit.id,
      barcode
    };

    this.commandes.push(nouvelleCommande);
    this.showProduitModal = false;
    this.showAlert('Article ajouté à la commande', 'success');
  }

  // ==================== COMMAND OPERATIONS ====================

  approvisionnementProduit(): void {
    if (this.commandes.length === 0) {
      this.showAlert('Aucune commande à traiter', 'warning');
      return;
    }

    // Validate all commands have quantity
    const invalidCommands = this.commandes.filter(c => !c.quantite || c.quantite === 0);
    if (invalidCommands.length > 0) {
      this.showAlert('Veuillez renseigner les quantités pour toutes les commandes', 'error');
      return;
    }

    this.showLoading('Enregistrement de l\'approvisionnement...');
    const username = this.userService.getUserConnected();

    this.commandeService.approvisionnementProduit(this.commandes, username.username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.hideLoading();
          this.showAlert('Approvisionnement effectué avec succès!', 'success');
          this.notificationService.success('Approvisionnement enregistré');

          // Reset and reload
          this.commandes = [];
          this.commandeService.updateLocalCommandes([]);
          this.loadPrixArticles();
        },
        error: (error) => {
          this.hideLoading();
          this.handleError('Erreur lors de l\'approvisionnement', error);
        }
      });
  }

  removeCommande(index: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette commande ?')) {
      this.commandes.splice(index, 1);
      this.commandeService.updateLocalCommandes(this.commandes);
      this.showAlert('Commande supprimée', 'info');
    }
  }

  rafraichir(): void {
    if (this.commandes.length > 0) {
      if (!confirm('Voulez-vous vraiment réinitialiser toutes les commandes en cours ?')) {
        return;
      }
    }

    this.commandes = [];
    this.commandeService.updateLocalCommandes([]);
    this.loadPrixArticles();
    this.showAlert('Données réinitialisées', 'info');
  }

  /* refreshProduit(): void {
     this.showLoading('Actualisation...');
     
     setTimeout(() => {
       window.location.reload();
     }, 1000);
   }**/

  // ==================== HELPER FUNCTIONS ====================

  private calculateCurrentStock(depot: any): void {
    const produitid = this.selectedProduit?.id;
    if (!produitid) return;

    const boutiqueid =this.autService.getBoutiqueByUserSession() ?? 0;
    const depotid = depot.id;
    const request = { boutiqueid, depotid };

    this.produitService.getStockByProduit(produitid, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stock) => {
          this.currentStock = stock;
        },
        error: (error) => console.error('Erreur lors du chargement du stock', error)
      });
  }

  private resetProduitForm(): void {
    this.produitForm.reset();
    this.produitForm.patchValue({
      prixVenteModifiable: false,
      pacquets: false,
      quantiteByPacquet: 1
    });
    this.depots = [];
    this.selectedProduit = null;
    this.selectedArticle = null;
    this.currentStock = 0;
    this.isCreatingNewProduct = false;
  }

  private dateNotInPastValidator() {
    return (control: AbstractControl) => {
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today ? null : { dateInPast: true };
    };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  closeModal(): void {
    this.showProduitModal = false;
    this.resetProduitForm();
  }

  // ==================== PAGINATION ====================

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPrixArticles(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadPrixArticles(0);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0;
    this.loadPrixArticles(0);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const maxVisiblePages = 5;
    const pages: number[] = [];

    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getQuantiteMagasin(item: PrixArticles): number {
    if (item.pointVente.boutique) {
      return 0;
    }

    let stock = 0;
    this.produitService.getStockByDepot(item.pointVente.produit.id, item.pointVente?.depotid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (depots) => stock = depots,
        error: (error) => console.error('Erreur chargement stock dépôt', error)
      });

    return stock;
  }

  // ==================== UI HELPERS ====================

  private showLoading(message: string = 'Chargement...'): void {
    this.isLoading = true;
    this.showAlert(message, 'info');
  }

  private hideLoading(): void {
    this.isLoading = false;
  }

  showAlert(message: string, type: AlertType): void {
    this.alertMessage = message;
    this.alertType = type;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.closeAlert();
    }, 5000);
  }

  closeAlert(): void {
    this.alertMessage = '';
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.hideLoading();
    this.showAlert(message, 'error');
    this.notificationService.error(message);
  }

  // ==================== GETTERS ====================

  get currentMonth(): string {
    return new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  }

  get isEditMode(): boolean {
    return this.editingIndex >= 0;
  }
}