// src/app/features/factures/pages/facture-list/facture-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FactureSummary } from '../../model/FactureSummary';
import { FactureSearchCriteria } from '../../model/FactureSearchCriteria';
import { StatutFacture } from '../../enums/StatutFacture';
import { FactureService } from '../../service/facture.service';
import { StatutFactureColor, StatutFactureLibelle } from '../../enums/ModePaiement';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-facture-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './facture-list.component.html',
  styleUrls: ['./facture-list.component.css']
})
export class FactureListComponent implements OnInit, OnDestroy {
  factures: FactureSummary[] = [];
  loading = false;
  loadingStats = false;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  Math = Math;
  
  // Statistiques
  statistiques: any = {
    nombreTotal: 0,
    nombrePayees: 0,
    nombreEnAttente: 0,
    nombreEnRetard: 0,
    montantTotal: 0,
    montantPaye: 0,
    montantRestant: 0
  };
  
  // Filtres
  searchCriteria: FactureSearchCriteria = {
    page: 0,
    size: 20,
    sortBy: 'dateFacture',
    sortDirection: 'DESC'
  };
  
  // Options de filtrage
  statutOptions = Object.values(StatutFacture);
  statutLibelle = StatutFactureLibelle;
  statutColor = StatutFactureColor;
  
  // Recherche
  searchTerm = '';
  searchSubject = new Subject<string>();
  
  // Filtres avancés
  showAdvancedFilters = false;
  dateFactureDebut?: Date;
  dateFactureFin?: Date;
  dateEcheanceDebut?: Date;
  dateEcheanceFin?: Date;
  selectedStatut?: StatutFacture;
  enRetard?: boolean;
  
  private destroy$ = new Subject<void>();

  constructor(
    private factureService: FactureService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadFactures();
    this.loadStatistiques();
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
        this.searchCriteria.numeroFacture = searchTerm || undefined;
        this.currentPage = 0;
        this.searchCriteria.page = 0;
        this.loadFactures();
      });
  }

  /**
   * Charge la liste des factures
   */
  loadFactures(): void {
    this.loading = true;
    
    this.factureService.listerFactures(this.searchCriteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.factures = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.number;
          this.loading = false;
          
          // Recalculer les statistiques après chargement
          this.calculateStatisticsFromList();
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Charge les statistiques depuis l'API
   */
  loadStatistiques(): void {
    this.loadingStats = true;
    
    this.factureService.getStatistiques()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistiques = stats;
          this.loadingStats = false;
        },
        error: () => {
          // En cas d'erreur, calculer depuis la liste
          this.calculateStatisticsFromList();
          this.loadingStats = false;
        }
      });
  }

  /**
   * Calcule les statistiques à partir de la liste des factures
   */
  calculateStatisticsFromList(): void {
    this.statistiques.nombreTotal = this.factures.length;
    this.statistiques.nombrePayees = this.factures.filter(f => 
      f.statut === StatutFacture.PAYEE
    ).length;
    this.statistiques.nombreEnAttente = this.factures.filter(f => 
      f.statut === StatutFacture.NON_PAYEE || 
      f.statut === StatutFacture.PARTIELLEMENT_PAYEE
    ).length;
    this.statistiques.nombreEnRetard = this.factures.filter(f => 
      this.isEnRetard(f)
    ).length;
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
      dateFactureDebut: this.dateFactureDebut,
      dateFactureFin: this.dateFactureFin,
      dateEcheanceDebut: this.dateEcheanceDebut,
      dateEcheanceFin: this.dateEcheanceFin,
      statut: this.selectedStatut,
      enRetard: this.enRetard,
      page: 0
    };
    
    this.currentPage = 0;
    this.loadFactures();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.dateFactureDebut = undefined;
    this.dateFactureFin = undefined;
    this.dateEcheanceDebut = undefined;
    this.dateEcheanceFin = undefined;
    this.selectedStatut = undefined;
    this.enRetard = undefined;
    
    this.searchCriteria = {
      page: 0,
      size: 20,
      sortBy: 'dateFacture',
      sortDirection: 'DESC'
    };
    
    this.currentPage = 0;
    this.loadFactures();
    this.loadStatistiques();
  }

  /**
   * Change de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.searchCriteria.page = page;
    this.loadFactures();
  }

  /**
   * Change la taille de page
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.searchCriteria.size = size;
    this.currentPage = 0;
    this.searchCriteria.page = 0;
    this.loadFactures();
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
    this.loadFactures();
  }

  /**
   * Navigation vers le détail
   */
  viewFacture(id: number): void {
    this.router.navigate(['/factures', id]);
  }

  /**
   * Navigation vers la création
   */
  createFacture(): void {
    this.router.navigate(['/factures/create']);
  }

  /**
   * Navigation vers l'édition
   */
  editFacture(id: number): void {
    this.router.navigate(['/factures', id, 'edit']);
  }

  /**
   * Imprime une facture
   */
  printFacture(id: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.factureService.genererPDF(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          // Créer une URL pour le blob
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Ouvrir dans une nouvelle fenêtre pour impression
          const printWindow = window.open(blobUrl, '_blank');
          
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
              // Nettoyer l'URL après impression
              setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
              }, 1000);
            };
          } else {
            // Si popup bloquée, télécharger le PDF
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `facture-${id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(blobUrl);
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'impression:', error);
        }
      });
  }

  /**
   * Télécharge le PDF d'une facture
   */
  downloadFacturePDF(id: number, numeroFacture: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.factureService.genererPDF(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${numeroFacture}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Erreur lors du téléchargement:', error);
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
  getStatutClass(statut: StatutFacture): string {
    return `badge badge-${this.statutColor[statut]}`;
  }

  /**
   * Retourne le libellé du statut
   */
  getStatutLibelle(statut: StatutFacture): string {
    //console.log("statut facture:", statut);
    //console.log("statut libelle:", this.statutLibelle[statut]);
    return this.statutLibelle[statut];
  }

  /**
   * Vérifie si une facture est en retard
   */
  isEnRetard(facture: FactureSummary): boolean {
    return facture.statut === StatutFacture.EN_RETARD || 
           (facture.joursRetard !== undefined && facture.joursRetard > 0);
  }

  /**
   * Toggle filtres avancés
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Exporte les factures
   */
  exportFactures(): void {
    // TODO: Implémenter l'export Excel/PDF
    console.log('Export factures');
  }

  /**
   * Rafraîchit la liste
   */
  refresh(): void {
    this.loadFactures();
    this.loadStatistiques();
  }
}