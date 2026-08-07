import { Component, computed, inject, signal } from '@angular/core';
import { MargeVente } from '../../model/marge-vente';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MargeVenteFilter } from '../../model/marge-vente-filter';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MargeVenteServiceService } from '../../service/marge-vente-service.service';
import { MargeVenteStats } from '../../model/marge-vente-stats';
import { Annee } from '../../model/annee';
import { Depot } from '../../model/depot';
import { Mois } from '../../model/mois';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user-service.service';
import { NgbPaginationConfig } from '@ng-bootstrap/ng-bootstrap';
import { TableSortConfig } from '../../model/table-sort-config';
import { CustomPaginationConfig } from '../../model/custom-pagination-config';


@Component({
  selector: 'app-marge-vente',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './marge-vente.component.html',
  styleUrl: './marge-vente.component.css'
})
export class MargeVenteComponent {
// Injections
  private readonly fb = inject(FormBuilder);
  private readonly margeVenteService = inject(MargeVenteServiceService);
  private readonly userService = inject(UserService);
  private readonly destroy$ = new Subject<void>();

  // Signals pour la réactivité
  readonly margesVente = signal<MargeVente[]>([]);
  readonly paginatedMarges = signal<MargeVente[]>([]);
  readonly annees = signal<Annee[]>([]);
  readonly datesByMois = signal<Date[]>([]);
  readonly depots = signal<Depot[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedMarge = signal<MargeVente | null>(null);
  readonly showEditModal = signal<boolean>(false);
  readonly position = signal<number>(1); // 1 = jour, 2 = mois
  readonly stats = signal<MargeVenteStats>({
    totalCaisse: 0,
    totalAchat: 0,
    remise: 0,
    totalMarge: 0
  });

  // Configuration pagination
  readonly paginationConfig = signal<CustomPaginationConfig>({
    currentPage: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0,
    pageSizeOptions: [10, 25, 50, 100, 250, 500]
  });

  // Configuration tri
  readonly sortConfig = signal<TableSortConfig>({
    field: null,
    direction: 'asc'
  });

  // Computed properties
  readonly isMargeJournalier = computed(() => this.position() === 1);
  readonly isMargeMensuel = computed(() => this.position() === 2);
  readonly canGenerate = computed(() => {
    const form = this.margeVenteForm;
    const pos = this.position();
    return form.valid && (pos === 2 || form.get('date')?.value);
  });
  readonly canEditSignal  = computed(() => {
    const marge = this.selectedMarge();
    return !! (marge && (marge.p?.id || marge.cpns?.id));
  });
  readonly canPrint = computed(() => this.position() === 2 && this.margesVente().length > 0);

  // Computed pour la pagination
  readonly paginationPages = computed(() => {
    const config = this.paginationConfig();
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const currentPage = config.currentPage;
    const totalPages = config.totalPages;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  });

  // Forms
  margeVenteForm!: FormGroup;
  editForm!: FormGroup;
  
  // Variables
  usertupdate!: string;

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.usertupdate = this.userService.getUserConnected().username;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.margeVenteForm = this.fb.group({
      annee: [null, Validators.required],
      date: [null],
      debut: [null],
      fin: [null]
    });

    this.editForm = this.fb.group({
      achat: [0, [Validators.required, Validators.min(0)]],
      prixVente: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private setupFormSubscriptions(): void {
    // Surveillance des changements avec debounce
    this.margeVenteForm.get('annee')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.onAnneeChange());
  }

  private loadInitialData(): void {
    this.isLoading.set(true);

    this.margeVenteService.getAnnees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (annees) => {
          this.annees.set(annees);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des années:', error);
          this.isLoading.set(false);
        }
      });

    this.margeVenteService.getDepots()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (depots) => this.depots.set(depots),
        error: (error) => console.error('Erreur lors du chargement des dépôts:', error)
      });
  }

  // Gestion des événements
  onAnneeChange(): void {
    const annee = this.margeVenteForm.get('annee')?.value;
    if (annee) {
      this.margeVenteService.getDateByAnnee(annee.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dates) => this.datesByMois.set(dates),
          error: (error) => console.error('Erreur lors du chargement des dates:', error)
        });
    }
  }

  onPositionChange(): void {
    this.margeVenteForm.patchValue({ date: null, debut: null, fin: null });
    this.resetData();
  }

  onDateChange(): void {
    if (this.position() === 1) {
      this.genererMarge();
    } else if (this.position() === 2) {
      this.genererMargeMensuel();
    }
  }

  // Actions principales
  genererMarge(): void {
    const dateValue = this.margeVenteForm.get('date')?.value;
    const anneeValue = this.margeVenteForm.get('annee')?.value;

    if (!dateValue || !anneeValue) return;

    this.isLoading.set(true);
    this.margesVente.set([]);

    this.margeVenteService.getMargeJournaliere(dateValue, anneeValue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (marges) => {
          this.margesVente.set(marges);
          this.calculateStats(marges);
          this.updatePagination();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des marges:', error);
          this.isLoading.set(false);
        }
      });
  }

  genererMargeMensuel(): void {
    const debutValue = this.margeVenteForm.get('debut')?.value;
    const finValue = this.margeVenteForm.get('fin')?.value;
    const anneeValue = this.margeVenteForm.get('annee')?.value;

    if (!debutValue || !finValue || !anneeValue) return;

    this.isLoading.set(true);

    this.margeVenteService.getMargeMargeMensuel(debutValue, finValue, anneeValue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (marges) => {
          this.margesVente.set(marges);
          this.calculateStats(marges);
          this.updatePagination();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des marges mensuelles:', error);
          this.isLoading.set(false);
        }
      });
  }

  rafraichir(): void {
    this.margeVenteForm.reset();
    this.resetData();
    this.position.set(1);
  }

  private resetData(): void {
    this.margesVente.set([]);
    this.paginatedMarges.set([]);
    this.selectedMarge.set(null);
    this.stats.set({
      totalCaisse: 0,
      totalAchat: 0,
      remise: 0,
      totalMarge: 0
    });
    this.paginationConfig.update(config => ({
      ...config,
      currentPage: 1,
      totalRecords: 0,
      totalPages: 0
    }));
  }

  // Gestion de l'édition
  editerMarge(marge: MargeVente): void {
    this.selectedMarge.set({ ...marge });
    this.editForm.patchValue({
      achat: marge.achat,
      prixVente: marge.prixVente
    });
    this.showEditModal.set(true);
  }

  validerEdition(): void {
    if (!this.editForm.valid || !this.selectedMarge()) return;

    const updatedMarge: MargeVente = {
      ...this.selectedMarge()!,
      achat: this.editForm.get('achat')?.value,
      prixVente: this.editForm.get('prixVente')?.value,
      usercreat: this.usertupdate,
      datevente: this.margeVenteForm.get('date')?.value
    };

    this.margeVenteService.validerAchat(updatedMarge)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showEditModal.set(false);
          this.genererMarge();
        },
        error: (error) => console.error('Erreur lors de la validation:', error)
      });
  }

  annulerEdition(): void {
    this.showEditModal.set(false);
    this.selectedMarge.set(null);
    this.editForm.reset();
  }

  // Impression
  imprimerRapport(): void {
    const anneeValue = this.margeVenteForm.get('annee')?.value;
    const dateValue = this.margeVenteForm.get('date')?.value;

    if (!anneeValue || !dateValue) return;

    const filter: MargeVenteFilter = {
      annee: anneeValue,
      date: dateValue,
      debut: new Date(),
      fin: new Date(),
      position: this.position()
    };

    this.margeVenteService.genererRapport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rapport-marge-${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => console.error('Erreur lors de la génération du rapport:', error)
      });
  }

  // Pagination
  onPageChange(page: number): void {
    if (page < 1 || page > this.paginationConfig().totalPages) return;
    
    this.paginationConfig.update(config => ({
      ...config,
      currentPage: page
    }));
    this.updatePaginatedData();
  }

 onPageSizeChange(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value);
  if (!isNaN(value)) {
    this.paginationConfig.update(config => ({
      ...config,
      pageSize: value,
      currentPage: 1
    }));
    this.updatePagination();
  }
}

  private updatePagination(): void {
    const totalRecords = this.margesVente().length;
    const pageSize = this.paginationConfig().pageSize;
    const totalPages = Math.ceil(totalRecords / pageSize);

    this.paginationConfig.update(config => ({
      ...config,
      totalRecords,
      totalPages
    }));

    this.updatePaginatedData();
  }

  private updatePaginatedData(): void {
    const config = this.paginationConfig();
    const startIndex = (config.currentPage - 1) * config.pageSize;
    const endIndex = startIndex + config.pageSize;
    const sortedData = this.getSortedData();
    
    this.paginatedMarges.set(sortedData.slice(startIndex, endIndex));
  }

  // Tri
  onSort(field: string): void {
    const currentSort = this.sortConfig();
    const newDirection = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
    
    this.sortConfig.set({
      field,
      direction: newDirection
    });
    
    this.updatePaginatedData();
  }

  private getSortedData(): MargeVente[] {
    const data = [...this.margesVente()];
    const sort = this.sortConfig();
    
    if (!sort.field) return data;

    return data.sort((a, b) => {
      const aValue = this.getFieldValue(a, sort.field!);
      const bValue = this.getFieldValue(b, sort.field!);
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private getFieldValue(item: MargeVente, field: string): any {
    switch (field) {
      case 'libelle': return item.libelle;
      case 'quantite': return item.quantite;
      case 'prixVente': return item.prixVente;
      case 'montant': return item.montant;
      case 'achat': return item.achat;
      case 'montanAchat': return item.montanAchat;
      case 'marge': return item.marge;
      default: return '';
    }
  }

  getSortIcon(field: string): string {
    const sort = this.sortConfig();
    if (sort.field !== field) return 'fas fa-sort';
    return sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // Calcul des statistiques
  private calculateStats(marges: MargeVente[]): void {
    const stats = marges.reduce((acc, marge) => ({
      totalCaisse: acc.totalCaisse + marge.montant,
      totalAchat: acc.totalAchat + marge.montanAchat,
      remise: acc.remise,
      totalMarge: acc.totalMarge + marge.marge
    }), {
      totalCaisse: 0,
      totalAchat: 0,
      remise: 0,
      totalMarge: 0
    });

    this.stats.set(stats);
  }

  // Utilitaires
  formatNumber(value: number): string {
    return this.margeVenteService.formatNumber(value);
  }

  formatDate(date: Date): string {
    return this.margeVenteService.formatDate(date);
  }

  getMoisName(typeMois: number): string {
    return this.margeVenteService.getMoisName(typeMois);
  }

  getMargeClass(marge: MargeVente): string {
    return marge.montant < marge.montanAchat ? 'table-danger' : '';
  }

  // Méthodes pour les computed properties (pour compatibilité template)
  get computedIsMargeJournalier(): boolean {
    return this.isMargeJournalier();
  }

  get computedIsMargeMensuel(): boolean {
    return this.isMargeMensuel();
  }

  get computedCanGenerate(): boolean {
    return this.canGenerate();
  }

  get computedCanEdit(): boolean {
    return this.canEditSignal () ;
  }

  get computedCanPrint(): boolean {
    return this.canPrint();
  }
get paginationInfo() {
  const config = this.paginationConfig();
  const start = config.totalRecords > 0 ? (config.currentPage - 1) * config.pageSize + 1 : 0;
  const end = Math.min(config.currentPage * config.pageSize, config.totalRecords);
  return { start, end, total: config.totalRecords };
}

get paginationInfoFooter() {
  const config = this.paginationConfig();
  const start = config.totalRecords > 0
    ? (config.currentPage - 1) * config.pageSize + 1
    : 0;
  const end = Math.min(config.currentPage * config.pageSize, config.totalRecords);
  return {
    start,
    end,
    total: config.totalRecords
  };
}
  
}
