import { Component } from '@angular/core';
import { VersementSummary } from '../../../model/VersementSummary';
import { StatutVersement, StatutVersementColor, StatutVersementLibelle } from '../../../enums/StatutVersement';
import { ModePaiement, ModePaiementLibelle } from '../../../enums/ModePaiement';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { VersementService } from '../../../service/VersementService';
import { Router } from '@angular/router';
import { VersementSearchCriteria } from '../../../model/VersementSearchCriteria';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-versement-list',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './versement-list.component.html',
  styleUrl: './versement-list.component.css'
})
export class VersementListComponent {
versements: VersementSummary[] = [];
  loading = false;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
 Math = Math
   username!: string;

    boutiqueid!: number;
    anneeid!: number;
  
  
  // Filtres
  searchCriteria: VersementSearchCriteria = {
    page: 0,
    size: 20,
    sortBy: 'dateVersement',
    sortDirection: 'DESC'
  };
  
  // Options de filtrage
  statutOptions = Object.values(StatutVersement);
  statutLibelle = StatutVersementLibelle;
  statutColor = StatutVersementColor;
  
  modePaiementOptions = Object.values(ModePaiement);
  modePaiementLibelle = ModePaiementLibelle;
  
  // Recherche
  searchTerm = '';
  searchSubject = new Subject<string>();
  
  // Filtres avancés
  showAdvancedFilters = false;
  dateVersementDebut?: Date;
  dateVersementFin?: Date;
  selectedStatut?: string;
  selectedModePaiement?: ModePaiement;
  
  private destroy$ = new Subject<void>();

  constructor(
    private versementService: VersementService,
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
    this.loadVersements();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configuration de la recherche avec debounce
   */
  setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchCriteria.numeroVersement = searchTerm || undefined;
        this.currentPage = 0;
        this.searchCriteria.page = 0;
        this.loadVersements();
      });
  }

  /**
   * Charge la liste des versements
   */
  loadVersements(): void {
    this.loading = true;
    
    this.versementService.listerVersements(this.searchCriteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.versements = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.number;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Recherche par terme
   */
  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Applique les filtres avancés
   */
  applyAdvancedFilters(): void {
    this.searchCriteria = {
      ...this.searchCriteria,
      dateVersementDebut: this.dateVersementDebut,
      dateVersementFin: this.dateVersementFin,
      statut: this.selectedStatut,
      modePaiement: this.selectedModePaiement,
      page: 0
    };
    
    this.currentPage = 0;
    this.loadVersements();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.dateVersementDebut = undefined;
    this.dateVersementFin = undefined;
    this.selectedStatut = undefined;
    this.selectedModePaiement = undefined;
    
    this.searchCriteria = {
      page: 0,
      size: 20,
      sortBy: 'dateVersement',
      sortDirection: 'DESC'
    };
    
    this.currentPage = 0;
    this.loadVersements();
  }

  /**
   * Change de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.searchCriteria.page = page;
    this.loadVersements();
  }

  /**
   * Tri
   */
  onSort(field: string): void {
    if (this.searchCriteria.sortBy === field) {
      this.searchCriteria.sortDirection = 
        this.searchCriteria.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.searchCriteria.sortBy = field;
      this.searchCriteria.sortDirection = 'ASC';
    }
    this.loadVersements();
  }

  /**
   * Navigation vers le détail
   */
  viewVersement(id: number): void {
    this.router.navigate(['/versements', id]);
  }

  /**
   * Navigation vers la création
   */
  createVersement(): void {
    this.router.navigate(['/versements/create']);
  }

  /**
   * Validation d'un versement
   */
  validerVersement(id: number): void {
    if (confirm('Confirmer la validation de ce versement ?')) {
      this.versementService.validerVersement(id, {
        username: this.username // TODO: Récupérer l'utilisateur connecté
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadVersements();
        }
      });
    }
  }

  /**
   * Télécharge le reçu
   */
  telechargerRecu(id: number): void {
    this.versementService.telechargerRecuPaiement(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `recu-${id}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
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
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(statut: StatutVersement): string {
    return `badge badge-${this.statutColor[statut]}`;
  }

  /**
   * Retourne le libellé du statut
   */
  getStatutLibelle(statut: StatutVersement): string {
    
    return this.statutLibelle[statut];
  }

  /**
   * Retourne le libellé du mode de paiement
   */
  getModePaiementLibelle(mode: ModePaiement): string {
    return this.modePaiementLibelle[mode];
  }

  /**
   * Toggle filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Rafraîchit la liste
   */
  refresh(): void {
    this.loadVersements();
  }

  /**
   * Exporte les versements
   */
  exportVersements(): void {
    // TODO: Implémenter l'export Excel/PDF
    console.log('Export versements');
  }

  /**
   * Vérifie si un versement peut être validé
   */
  canValider(versement: VersementSummary): boolean {
    return versement.statut === StatutVersement.EN_ATTENTE;
  }
}
