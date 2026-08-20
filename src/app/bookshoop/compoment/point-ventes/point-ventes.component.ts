import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, forkJoin, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

import { PrixArticles } from '../../model/prix-articles';
import { Commande } from '../../model/commande';
import { Depot } from '../../model/depot';
import { Boutique } from '../../model/boutique';
import { Ville } from '../../model/ville';
import { PointVente } from '../../model/point-vente';
import { PointVenteService } from '../../service/point-vente.service';

declare var $: any;

interface Message {
  severity: 'success' | 'error' | 'warning' | 'info';
  summary: string;
  detail: string;
}

interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-point-ventes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './point-ventes.component.html',
  styleUrl: './point-ventes.component.css'
})
export class PointVentesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Formulaires
  pointVenteForm!: FormGroup;
  boutiqueForm!: FormGroup;
  commandeForm!: FormGroup;
  searchForm!: FormGroup;

  // Données
  listePrixArticles: PrixArticles[] = [];
  filteredPrixArticles: PrixArticles[] = [];
  listeCommandes: Commande[] = [];
  listeDepots: Depot[] = [];
  listeBoutiques: Boutique[] = [];
  listeVilles: Ville[] = [];

  // État
  currentPointVente: PointVente | null = null;
  currentCommande: Commande = this.initCommande();
  isEditing = false;
  loading = false;
  submitting = false;

  // Pagination
  pagination: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };

  // Options de pagination
  itemsPerPageOptions = [5, 10, 25, 50, 100];

  // Messages
  messages: Message[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly pointVenteService: PointVenteService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.subscribeToPointVenteChanges();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.pointVenteForm = this.fb.group({
      depot: [null, Validators.required],
      boutique: [null, Validators.required]
    });

    this.boutiqueForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(3)]],
      heureDebut: ['', Validators.required],
      heureFin: ['', Validators.required],
      quartier: ['', [Validators.required, Validators.minLength(3)]],
      ville: [null, Validators.required]
    });

    this.commandeForm = this.fb.group({
      quantite: [0, [Validators.required, Validators.min(1)]],
      remise: [0, [Validators.min(0), Validators.max(100)]],
      tva: [0, [Validators.min(0)]],
      prixVenteNet: [0, [Validators.required, Validators.min(0)]]
    });

    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  private loadInitialData(): void {
    this.loading = true;

    const requests$ = forkJoin({
      prixArticles: this.pointVenteService.getAllPrixArticles(),
      depots: this.pointVenteService.getAllDepots(),
      boutiques: this.pointVenteService.getAllBoutiques(),
      villes: this.pointVenteService.getAllVilles()
    });

    requests$.pipe(
      takeUntil(this.destroy$),
      // "complete" ne se declenche jamais apres "error" sur un forkJoin - si
      // loading n'etait remis a false qu'ici, une seule requete en echec
      // laissait le spinner tourner indefiniment malgre le bandeau d'erreur
      // affiche juste au-dessus.
      finalize(() => this.loading = false)
    ).subscribe({
      next: ({ prixArticles, depots, boutiques, villes }) => {
        this.listePrixArticles = prixArticles || [];
        this.filteredPrixArticles = [...this.listePrixArticles];
        this.listeDepots = depots || [];
        this.listeBoutiques = boutiques || [];
        this.listeVilles = villes || [];
        this.updatePagination();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données :', error);
        this.showMessage('error', 'Erreur', 'Impossible de charger les données');
      }
    });
  }

  private setupSearchSubscription(): void {
    this.searchForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm: string) => {
        this.performSearch(searchTerm);
      });
  }

  private performSearch(searchTerm: string): void {
    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      this.filteredPrixArticles = this.listePrixArticles.filter(item =>
        item.pointVente.produit.reference?.toLowerCase().includes(term) ||
        item.pointVente.produit.libelle?.toLowerCase().includes(term) ||
        item.pointVente.boutique?.nom?.toLowerCase().includes(term)
      );
    } else {
      this.filteredPrixArticles = [...this.listePrixArticles];
    }
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.pagination.totalItems = this.filteredPrixArticles.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);

    // Ajuster la page courante si nécessaire
    if (this.pagination.currentPage > this.pagination.totalPages && this.pagination.totalPages > 0) {
      this.pagination.currentPage = this.pagination.totalPages;
    }
  }

  private initCommande(): Commande {
    return {
      dateReception: new Date(),
      numeroRepartition: '',
      quantite: 0,
      prixAchat: 0,
      prixVente: 0,
      tva: 0,
      remise: 0
    };
  }

  private subscribeToPointVenteChanges(): void {
    this.pointVenteService.pointVente$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pointVente => {
        this.currentPointVente = pointVente;
        this.isEditing = !!pointVente?.id;
        if (pointVente?.id) {
          this.loadCommandes(pointVente.id);
        }
      });
  }

  // Actions principales
  onAjouter(): void {
    if (this.pointVenteForm.valid) {
      $('#commandeModal').modal('show');
      this.currentCommande = this.initCommande();
      this.listeCommandes = [];
    } else {
      this.showMessage('warning', 'Attention', 'Veuillez sélectionner un dépôt et une boutique');
    }
  }

  onModifier(): void {
    if (this.currentPointVente && this.commandeForm.valid) {
      this.submitting = true;
      const commandeData = { ...this.commandeForm.value };
      commandeData.prixVente = this.calculatePrixTTC();

      this.pointVenteService.updateCommande(commandeData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showMessage('success', 'Succès', 'Commande mise à jour avec succès');
            this.refreshData();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            this.showMessage('error', 'Erreur', 'Impossible de mettre à jour la commande');
          },
          complete: () => {
            this.submitting = false;
          }
        });
    }
  }

  onRafraichir(): void {
    this.reset();
    this.loadInitialData();
  }

  onImprimer(): void {
    const boutique = this.pointVenteForm.get('boutique')?.value;
    if (boutique?.id) {
      this.pointVenteService.printPointVenteByBoutique(boutique.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            this.downloadBlob(blob, `point-vente-${boutique.nom}-${new Date().toISOString().split('T')[0]}.pdf`);
          },
          error: (error) => {
            console.error('Erreur lors de l\'impression:', error);
            this.showMessage('error', 'Erreur', 'Impossible d\'imprimer le rapport');
          }
        });
    }
  }

  // Gestion des commandes
  addCommande(): void {
    if (this.commandeForm.valid) {
      const formValue = this.commandeForm.value;
      const nouvelleCommande: Commande = {
        ...formValue,
        prixVenteTTC: this.calculatePrixTTC(),
        produit: this.currentPointVente?.produit
      };

      this.listeCommandes.push(nouvelleCommande);
      this.commandeForm.reset();
      this.showMessage('success', 'Succès', 'Commande ajoutée à la liste');
    }
  }

  validerCommandes(): void {
    if (this.listeCommandes.length === 0) return;

    this.submitting = true;
    const requests$ = this.listeCommandes.map(cmd =>
      this.pointVenteService.addCommande(cmd)
    );

    forkJoin(requests$).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showMessage('success', 'Succès', 'Toutes les commandes ont été enregistrées');
        $('#commandeModal').modal('hide');
        this.refreshData();
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.showMessage('error', 'Erreur', 'Impossible d\'enregistrer les commandes');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  // Gestion des boutiques
  ajouterBoutique(): void {
    if (this.boutiqueForm.valid) {
      this.submitting = true;
      const nouvelleBoutique: Boutique = this.boutiqueForm.value;

      this.pointVenteService.createBoutique(nouvelleBoutique)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (boutique) => {
            this.listeBoutiques.push(boutique);
            this.boutiqueForm.reset();
            $('#boutiqueModal').modal('hide');
            this.showMessage('success', 'Succès', 'Boutique créée avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.showMessage('error', 'Erreur', 'Impossible de créer la boutique');
          },
          complete: () => {
            this.submitting = false;
          }
        });
    }
  }

  // Gestion de la pagination
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
    }
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.pagination.itemsPerPage = itemsPerPage;
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  getPaginatedItems(): PrixArticles[] {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const end = start + this.pagination.itemsPerPage;
    return this.filteredPrixArticles.slice(start, end);
  }

  getPaginationInfo(): string {
    if (this.pagination.totalItems === 0) {
      return 'Aucun élément trouvé';
    }

    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1;
    const end = Math.min(this.pagination.currentPage * this.pagination.itemsPerPage, this.pagination.totalItems);

    return `Affichage de ${start} à ${end} sur ${this.pagination.totalItems} éléments`;
  }

  getPaginationArray(): number[] {
    const maxVisible = 5;
    const total = this.pagination.totalPages;
    const current = this.pagination.currentPage;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  showDetails(item: PrixArticles): void {
    this.pointVenteService.setCurrentPointVente(item.pointVente);
    this.currentCommande = {
      ...this.initCommande(),
      quantite: 0,
      remise: item.remise,
      tva: item.tva,
      prixVente: item.prixVenteNet
    };
    this.commandeForm.patchValue(this.currentCommande);
    this.isEditing=true;
  }

  // Utilitaires
  private loadCommandes(pointVenteId: number): void {
    this.pointVenteService.getCommandesByPointVente(pointVenteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commandes) => {
          this.listeCommandes = commandes || [];
        },
        error: (error) => {
          console.error('Erreur lors du chargement des commandes:', error);
        }
      });
  }

  calculatePrixTTC(): number {
    const prixNet = this.commandeForm.get('prixVenteNet')?.value || 0;
    const tva = this.commandeForm.get('tva')?.value || 0;
    return this.pointVenteService.calculatePrixTTC(prixNet, tva);
  }

  private refreshData(): void {
    this.loadInitialData();
  }

  private reset(): void {
    this.currentPointVente = null;
    this.currentCommande = this.initCommande();
    this.isEditing = false;
    this.pointVenteForm.reset();
    this.commandeForm.reset();
    this.searchForm.reset();
    this.pagination.currentPage = 1;
    this.pointVenteService.setCurrentPointVente(null);
  }

  private showMessage(severity: Message['severity'], summary: string, detail: string): void {
    this.messages = [{ severity, summary, detail }];
    setTimeout(() => {
      this.messages = [];
    }, 5000);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Formatage
  formatNumber(value: number): string {
    return this.pointVenteService.formatNumber(value);
  }

  calculateEstimation(stockFinal: number, prixVenteNet: number): string {
    const estimation = this.pointVenteService.calculateEstimationStock(stockFinal, prixVenteNet);
    return this.formatNumber(estimation);
  }

  calculateEstimationTotal(): string {
    let estimation = 0;
    this.listePrixArticles.forEach((pa) => {
      estimation += this.pointVenteService.calculateEstimationStock(pa.pointVente.stockFinalTheorie, pa.prixVenteNet);
    });
    
    return this.formatNumber(estimation);
  }


  // Getters pour le template
  get isFormValid(): boolean {
    return this.pointVenteForm.valid;
  }

  get canModify(): boolean {
    return this.isEditing && this.commandeForm.valid;
  }

  get hasNextPage(): boolean {
    return this.pagination.currentPage < this.pagination.totalPages;
  }

  get hasPreviousPage(): boolean {
    return this.pagination.currentPage > 1;
  }

  // TrackBy functions pour optimiser les performances
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  trackByPage(index: number, page: number): number {
    return page;
  }

  // Validation helpers
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `${fieldName} doit être supérieur à ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} doit être inférieur à ${field.errors['max'].max}`;
    }
    return '';
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}