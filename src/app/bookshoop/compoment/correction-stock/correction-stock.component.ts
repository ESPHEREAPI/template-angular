import { Component } from '@angular/core';
import { PointVente } from '../../model/point-vente';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { Categorie } from '../../model/categorie';
import { CorrectionStockServiceService } from '../../service/correction-stock-service.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-correction-stock',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule, ToastrModule],
  templateUrl: './correction-stock.component.html',
  styleUrl: './correction-stock.component.css'
})
export class CorrectionStockComponent {

  correctionForm: FormGroup;
  motifForm: FormGroup;
  boutiques: Boutique[] = [];
  categories: Categorie[] = [];
  pointsVente: PointVente[] = [];
  filteredPointsVente: PointVente[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50, 100, 500, 1000];

  // Filtres
  globalFilter = '';
  referenceFilter = '';
  libelleFilter = '';

  // Loading states
  loading = false;
  saving = false;
  printing = false;

  constructor(
    private fb: FormBuilder,
    private correctionService: CorrectionStockServiceService,
    private toastr: ToastrService
  ) {
    this.correctionForm = this.fb.group({
      boutique: [null, Validators.required],
      categories: [null, Validators.required]
    });
    this.motifForm = this.fb.group({
      motif: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadBoutiques();
    this.loadCategories();
    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    // Surveiller les changements de boutique et catégorie
    this.correctionForm.valueChanges.subscribe(() => {
      this.loadPointsVente();
    });
  }

  loadBoutiques(): void {
    this.correctionService.getBoutiques().subscribe({
      next: (data) => {
        this.boutiques = data
          .flatMap(depot => depot.boutique || [])
          .filter((b): b is Boutique => b !== null);
      },
      error: (error) => {
        this.toastr.error('Erreur lors du chargement des boutiques', 'Erreur');
      }
    });
  }

  loadCategories(): void {
    this.correctionService.getCategories().subscribe({
      next: (response) => {
    
          this.categories = response;
   
      },
      error: (error) => {
        this.toastr.error('Erreur lors du chargement des catégories', 'Erreur');
      }
    });
  }

  loadPointsVente(): void {
    const formValue = this.correctionForm.value;
    if (!formValue.boutique || !formValue.categories) {
      this.pointsVente = [];
      this.filteredPointsVente = [];
      return;
    }

    this.loading = true;
    this.correctionService.getPointsVente(
      formValue.boutique.id,
      formValue.categories.id
    ).subscribe({
      next: (response) => {
      
          this.pointsVente = response;
          this.applyFilters();
  
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Erreur lors du chargement des points de vente', 'Erreur');
        this.loading = false;
      }
    });

    console.log(this.pointsVente);
  }

  applyFilters(): void {
    let filtered = [...this.pointsVente];

    // Filtre global
    if (this.globalFilter) {
      const search = this.globalFilter.toLowerCase();
      filtered = filtered.filter(item =>
        item.produit.reference.toLowerCase().includes(search) ||
        item.produit.libelle.toLowerCase().includes(search)
      );
    }

    // Filtre par référence
    if (this.referenceFilter) {
      filtered = filtered.filter(item =>
        item.produit.reference.toLowerCase().startsWith(this.referenceFilter.toLowerCase())
      );
    }

    // Filtre par libellé
    if (this.libelleFilter) {
      filtered = filtered.filter(item =>
        item.produit.libelle.toLowerCase().startsWith(this.libelleFilter.toLowerCase())
      );
    }

    this.filteredPointsVente = filtered;
    this.totalItems = filtered.length;
  }

  onGlobalFilterChange(): void {
    this.applyFilters();
    this.currentPage = 1;
  }

  onReferenceFilterChange(): void {
    this.applyFilters();
    this.currentPage = 1;
  }

  onLibelleFilterChange(): void {
    this.applyFilters();
    this.currentPage = 1;
  }

  onQuantiteChange(item: PointVente, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    const parsed = parseFloat(value);

    if (!isNaN(parsed) && parsed >= 0) {
      item.stockFinalTheorie = parsed;
    } else {
      console.warn('Quantité invalide :', value);
    }
  }

  blurInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.blur();
  }

  onQuantiteChangePrix(item: PointVente, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    const parsed = parseFloat(value);

    if (!isNaN(parsed) && parsed >= 0) {
      item.prix = parsed;
    } else {
      console.warn('Quantité invalide :', value);
    }
  }

  blurInputPrix(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.blur();
  }

  saveCorrections(): void {
    if (this.correctionForm.invalid) {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires', 'Attention');
      return;
    }

    if (this.motifForm.invalid) {
      this.toastr.warning('Veuillez indiquer un motif (5 caracteres minimum) pour cette correction', 'Attention');
      this.motifForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const motif = this.motifForm.value.motif;
    this.correctionService.saveCorrections(this.pointsVente, motif).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Corrections sauvegardées avec succès', 'Succès');
          this.motifForm.reset();
        } else {
          this.toastr.error(response.message || 'Erreur lors de la sauvegarde', 'Erreur');
        }
        this.saving = false;
      },
      error: (error) => {
        const message = error?.status === 403
          ? 'Vous n\'avez pas les droits pour corriger le stock (reserve aux administrateurs)'
          : 'Erreur lors de la sauvegarde';
        this.toastr.error(message, 'Erreur');
        this.saving = false;
      }
    });
  }

  printReport(): void {
    const formValue = this.correctionForm.value;
    if (!formValue.boutique || !formValue.categories) {
      this.toastr.warning('Veuillez sélectionner une boutique et une catégorie', 'Attention');
      return;
    }

    this.printing = true;
    this.correctionService.printReport(
      formValue.boutique.id,
      formValue.categories.id
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `correction_stock_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.printing = false;
      },
      error: (error) => {
        this.toastr.error('Erreur lors de l\'impression', 'Erreur');
        this.printing = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
  }

  getPaginatedItems(): PointVente[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    console.log(this.itemsPerPage);
    return this.filteredPointsVente.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  trackByFn(index: number, item: PointVente): any {
    return item.id || index;
  }
  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
