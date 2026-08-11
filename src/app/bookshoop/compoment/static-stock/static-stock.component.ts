import { Component, OnDestroy, OnInit, TrackByFunction } from '@angular/core';
import { StockItem } from '../../model/stock-item';
import { PrixArticles } from '../../model/prix-articles';
import { BehaviorSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, finalize, map, startWith, Subject, takeUntil, tap } from 'rxjs';
import { GestionStockService } from '../../service/gestion-stock.service';
import { FormatService } from '../../service/format.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibelleStock } from '../../model/libelle-stock';
import { PaginationConfig } from '../../model/pagination-config';
import { StockFilter } from '../../model/stock-filter';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../service/notification.service';
interface ComponentState {
  loading: boolean;
  error: string | null;
  exportingPdf: boolean;
}
@Component({
  selector: 'app-static-stock',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule ],
  templateUrl: './static-stock.component.html',
  styleUrl: './static-stock.component.css'
})
export class StaticStockComponent  implements OnInit, OnDestroy{
// Formulaires réactifs
  readonly filterForm: FormGroup;
  readonly searchForm: FormGroup;

  // État du composant
  private readonly state$ = new BehaviorSubject<ComponentState>({
    loading: false,
    error: null,
    exportingPdf: false
  });

  // Données
  readonly libelleStockOptions$ = new BehaviorSubject<LibelleStock[]>([]);
  readonly stockData$ = new BehaviorSubject<PrixArticles[]>([]);
  readonly filteredData$ = new BehaviorSubject<PrixArticles[]>([]);

  // Pagination
  readonly pagination$ = new BehaviorSubject<PaginationConfig>({
    page: 0,
    size: 50,
    totalElements: 0,
    totalPages: 0
  });

  // Configuration
  readonly pageSizeOptions = [10, 25, 50, 100, 250, 500];
  
  // Filtres
  private readonly currentFilter$ = new BehaviorSubject<StockFilter>({});
  private readonly selectedLibelle$ = new BehaviorSubject<LibelleStock | null>(null);

  // Sujets RxJS
  private readonly destroy$ = new Subject<void>();
  private readonly searchTrigger$ = new Subject<string>();
  private readonly refreshTrigger$ = new Subject<void>();

  // Getters pour le template
  get state() { return this.state$.value; }
  get libelleOptions() { return this.libelleStockOptions$.value; }
  get filteredData() { return this.filteredData$.value; }
  get pagination() { return this.pagination$.value; }
  get selectedLibelle() { return this.selectedLibelle$.value; }

  constructor(
    private readonly stockService: GestionStockService,
    private readonly formatService: FormatService,
    private readonly notificationService: NotificationService,
    private readonly fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
    this.searchForm = this.createSearchForm();
    this.setupSubscriptions();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // TrackBy functions pour optimiser les performances
  readonly trackByLibelle: TrackByFunction<LibelleStock> = (index, item) => item.id;
  readonly trackByStock: TrackByFunction<PrixArticles> = (index, item) => 
    `${item.pointVente.id}-${item.pointVente.produit.id}`;

  /**
   * Création du formulaire de filtres
   */
  private createFilterForm(): FormGroup {
    return this.fb.group({
      libelleStock: [null, Validators.required],
      dateDebut: [null],
      dateFin: [null],
      stockMinimum: [null, [Validators.min(0)]],
      stockMaximum: [null, [Validators.min(0)]]
    });
  }

  /**
   * Création du formulaire de recherche
   */
  private createSearchForm(): FormGroup {
    return this.fb.group({
      globalSearch: ['', [Validators.maxLength(100)]]
    });
  }

  /**
   * Configuration des souscriptions
   */
  private setupSubscriptions(): void {
    // Recherche avec debounce
    this.searchForm.get('globalSearch')?.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => this.searchTrigger$.next(term || ''));

    // Sélection du libellé
    this.filterForm.get('libelleStock')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(libelle => {
        this.selectedLibelle$.next(libelle);
        if (libelle) {
          this.resetPagination();
          this.loadStockData();
        } else {
          this.clearStockData();
        }
      });

    // Combinaison recherche + données pour filtrage
    combineLatest([
      this.stockData$,
      this.searchTrigger$,
      this.currentFilter$
    ]).pipe(
      map(([data, search, filter]) => this.applyFilters(data, search, filter)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => {
      this.filteredData$.next(filtered);
      this.updatePaginationTotal(filtered.length);
    });

    // Gestion des erreurs globales
    this.state$
      .pipe(
        map(state => state.error),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(error => {
        if (error) {
          this.notificationService.error(error);
        }
      });
  }

  /**
   * Chargement des données initiales
   */
  private loadInitialData(): void {
    this.updateState({ loading: true, error: null });
    
    this.stockService.getLibelleStock()
      .pipe(
        tap(options => this.libelleStockOptions$.next(options)),
        catchError(error => {
          this.updateState({ error: 'Erreur lors du chargement des options' });
          console.error('Error loading libelle stock options:', error);
          return [];
        }),
        finalize(() => this.updateState({ loading: false })),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Chargement des données de stock
   */
  private loadStockData(): void {
    const libelle = this.selectedLibelle$.value;
    if (!libelle) return;

    this.updateState({ loading: true, error: null });

    const filter = this.buildCurrentFilter();
    const pagination = this.pagination$.value;

    this.stockService.loadStockByPointVente(libelle.id, filter, pagination)
      .pipe(
        tap(result => {
          this.stockData$.next(result.data || []);
          this.updatePaginationFromResult(result);
        }),
        catchError(error => {
          this.updateState({ error: 'Erreur lors du chargement des données' });
          console.error('Error loading stock data:', error);
          return [];
        }),
        finalize(() => this.updateState({ loading: false })),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Construction du filtre actuel
   */
  private buildCurrentFilter(): StockFilter {
    const formValues = this.filterForm.value;
    return {
      ...this.currentFilter$.value,
      dateDebut: formValues.dateDebut,
      dateFin: formValues.dateFin,
      stockMinimum: formValues.stockMinimum,
      stockMaximum: formValues.stockMaximum
    };
  }

  /**
   * Application des filtres
   */
  private applyFilters(data: PrixArticles[], searchTerm: string, filter: StockFilter): PrixArticles[] {
    let filtered = [...data];

    // Filtre de recherche globale
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.pointVente.produit.reference.toLowerCase().includes(term) ||
        item.pointVente.produit.libelle.toLowerCase().includes(term) 
      );
    }

    // Filtres de stock
    if (filter.stockMinimum !== undefined && filter.stockMinimum !== null) {
      filtered = filtered.filter(item => 
        this.getTotalQuantity(item) >= filter.stockMinimum!
      );
    }

    if (filter.stockMaximum !== undefined && filter.stockMaximum !== null) {
      filtered = filtered.filter(item => 
        this.getTotalQuantity(item) <= filter.stockMaximum!
      );
    }

    return filtered;
  }

  /**
   * Mise à jour de l'état
   */
  private updateState(partialState: Partial<ComponentState>): void {
    this.state$.next({ ...this.state$.value, ...partialState });
  }

  /**
   * Mise à jour de la pagination
   */
  private updatePaginationTotal(total: number): void {
    const current = this.pagination$.value;
    this.pagination$.next({
      ...current,
      totalElements: total,
      totalPages: Math.ceil(total / current.size)
    });
  }

  /**
   * Mise à jour pagination depuis résultat API
   */
  private updatePaginationFromResult(result: any): void {
    const current = this.pagination$.value;
    this.pagination$.next({
      ...current,
      totalElements: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / current.size)
    });
  }

  /**
   * Réinitialisation de la pagination
   */
  private resetPagination(): void {
    const current = this.pagination$.value;
    this.pagination$.next({ ...current, page: 0 });
  }

  /**
   * Nettoyage des données de stock
   */
  private clearStockData(): void {
    this.stockData$.next([]);
    this.filteredData$.next([]);
    this.resetPagination();
  }

  // Méthodes publiques pour le template

  /**
   * Changement de taille de page
   */
  onPageSizeChange(size: number): void {
    const current = this.pagination$.value;
    this.pagination$.next({ ...current, size, page: 0 });
    this.loadStockData();
  }

  /**
   * Changement de page
   */
  onPageChange(page: number): void {
    const current = this.pagination$.value;
    this.pagination$.next({ ...current, page });
    this.loadStockData();
  }

  /**
   * Rafraîchissement des données
   */
  onRefresh(): void {
    this.refreshTrigger$.next();
    this.loadStockData();
  }

  /**
   * Réinitialisation des filtres
   */
  onResetFilters(): void {
    this.filterForm.patchValue({
      dateDebut: null,
      dateFin: null,
      stockMinimum: null,
      stockMaximum: null
    });
    this.searchForm.patchValue({ globalSearch: '' });
    this.currentFilter$.next({});
  }

  /**
   * Export PDF
   */
  onExportPdf(): void {
    const libelle = this.selectedLibelle$.value;
    if (!libelle) {
      this.notificationService.warning('Veuillez sélectionner un libellé de stock');
      return;
    }

    this.updateState({ exportingPdf: true });

    this.stockService.exportStockToPdf(libelle.id)
      .pipe(
        tap(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `stock-${libelle.libelle}-${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.success('Export PDF réussi');
        }),
        catchError(error => {
          console.error('Error exporting PDF:', error);
          this.notificationService.error('Erreur lors de l\'export PDF');
          return [];
        }),
        finalize(() => this.updateState({ exportingPdf: false })),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  // Méthodes utilitaires

  getTotalQuantity(item: PrixArticles): number {
    return this.stockService.calculateTotalQuantity(item);
  }

  getStockEstimation(item: PrixArticles): string {
    const estimation = this.stockService.calculateStockEstimation(item);
    return this.formatService.formatNumberGeneral(estimation);
  }

  formatNumber(value: number): string {
    return this.formatService.formatNumberGeneral(value);
  }

  getRowClass(item: PrixArticles): string {
    return this.stockService.getRowStyleClass(item.pointVente.stockFinalTheorie);
  }

  // Getters pour la pagination
  get paginationInfo(): string {
    const p = this.pagination$.value;
    if (p.totalElements === 0) return '0 résultats';
    
    const start = p.page * p.size + 1;
    const end = Math.min((p.page + 1) * p.size, p.totalElements);
    return `${start}-${end} sur ${p.totalElements} résultats`;
  }

  get canGoPrevious(): boolean {
    return this.pagination$.value.page > 0;
  }

  get canGoNext(): boolean {
    const p = this.pagination$.value;
    return p.page < p.totalPages - 1;
  }

  get hasData(): boolean {
    return this.filteredData$.value.length > 0;
  }

  get showNoResults(): boolean {
    return !this.state.loading && this.filteredData$.value.length === 0 && this.selectedLibelle$.value !== null;
  }

  // Méthodes pour les statistiques rapides
  getStockEnBon(): number {
    return this.filteredData$.value.filter(item => this.getTotalQuantity(item) > 50).length;
  }

  getStockFaible(): number {
    return this.filteredData$.value.filter(item => {
      const qty = this.getTotalQuantity(item);
      return qty > 10 && qty <= 50;
    }).length;
  }

  getStockCritique(): number {
    return this.filteredData$.value.filter(item => this.getTotalQuantity(item) <= 10).length;
  }

  /**
   * Validation personnalisée pour les filtres de stock
   */
  private validateStockFilters(): boolean {
    const min = this.filterForm.get('stockMinimum')?.value;
    const max = this.filterForm.get('stockMaximum')?.value;
    
    if (min !== null && max !== null && min > max) {
      this.notificationService.warning('Le stock minimum ne peut pas être supérieur au stock maximum');
      return false;
    }
    
    return true;
  }

  /**
   * Application des filtres avec validation
   */
  onApplyFilters(): void {
    if (!this.validateStockFilters()) return;
    
    const filters = this.buildCurrentFilter();
    this.currentFilter$.next(filters);
    this.resetPagination();
    this.loadStockData();
  }
}
