import { Component } from '@angular/core';
import { Inventaire } from '../../model/inventaire';
import { InventaireFilter } from '../../model/inventaire-filter';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChoixInventaire } from '../../enums/choix-inventaire';
import { InventaireService } from '../../service/inventaire-service.service';
import { ToastrService } from 'ngx-toastr';
import { Boutique } from '../../model/boutique';
import { Categorie } from '../../model/categorie';
import { Depot } from '../../model/depot';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-inventaire',
  standalone: true,
  imports: [ CommonModule,
    ReactiveFormsModule,
    FormsModule
   ],
  templateUrl: './inventaire.component.html',
  styleUrl: './inventaire.component.css'
})
export class InventaireComponent {
 inventaireForm!: FormGroup;
  inventaires: Inventaire[] = [];
  filteredInventaires: Inventaire[] = [];
  
  // Données de sélection
  boutiques: Boutique[] = [];
  categories: Categorie[] = [];
  depots: Depot[] = [];
  datesInventaire: Date[] = [];
  
  // État du composant
  choixInventaire: ChoixInventaire = ChoixInventaire.BOUTIQUE;
  selectedInventaire: Inventaire | null = null;
  isEditing: boolean = false;
  isLoading: boolean = false;
  isBoutique:boolean=true;
  isDepot:boolean=false;
  isDate:boolean=false;
  
  // Pagination et filtrage
  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalItems: number = 0;
  searchText: string = '';
  
  // Enum pour le template
  ChoixInventaire = ChoixInventaire;

  constructor(
    private fb: FormBuilder,
    private inventaireService: InventaireService,
    private toastr: ToastrService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.inventaireForm = this.fb.group({
      choix: [ChoixInventaire.BOUTIQUE, [Validators.required]],
      boutique: [null],
      categorie: [null],
      depot: [null],
      dateInventaire: [null],
      prix: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private loadInitialData(): void {
    // Seul le mode "Par boutique" (choix par defaut) a un backend fonctionnel
    // aujourd'hui - /depots et /inventaires/dates n'existent pas cote
    // serveur, donc charger ces listes des l'ouverture de l'ecran declenchait
    // deux erreurs a chaque visite, meme pour un utilisateur qui ne compte
    // utiliser que le mode boutique. Chargees a la demande (onChoixChange).
    this.loadBoutiques();
    this.loadCategories();
  }

  private loadBoutiques(): void {
    this.inventaireService.getBoutiques().subscribe({
      next: (data) => {
        if(data.length!=0)
        this.boutiques = data
  .flatMap(depot => depot.boutique || [])
  .filter((b): b is Boutique => b !== null);
      },
      error: (error) => this.toastr.error('Erreur lors du chargement des boutiques')
    });
  }

  private loadCategories(): void {
    this.inventaireService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (error) => this.toastr.error('Erreur lors du chargement des catégories')
    });
  }

  private loadDepots(): void {
    this.inventaireService.getDepots().subscribe({
      next: (data) => this.depots = data,
      error: (error) => this.toastr.error('Erreur lors du chargement des dépôts')
    });
  }

  private loadDatesInventaire(): void {
   /** */ this.inventaireService.getDatesInventaire().subscribe({
      next: (data) => this.datesInventaire = data,
      error: (error) => this.toastr.error('Erreur lors du chargement des dates')
    });
  }

  onChoixChange(): void {
    this.choixInventaire = this.inventaireForm.get('choix')?.value;
     console.log("choix",this.choixInventaire)
      switch(this.choixInventaire) {
       
    case ChoixInventaire.BOUTIQUE:
      // Logique spécifique à la boutique
      this.isBoutique=true;
      this.isDate=false;
      this.isDepot=false;
      console.log('Inventaire par boutique sélectionné');
      break;

    case ChoixInventaire.DEPOT:
      // Logique spécifique au dépôt
      console.log('Inventaire par dépôt sélectionné');
      this.isBoutique=false;
      this.isDate=false;
      this.isDepot=true;
      break;

      case ChoixInventaire.DATE:
      // Logique spécifique au dépôt
      console.log('Inventaire par dépôt sélectionné');
      this.isBoutique=false;
      this.isDate=true;
      this.isDepot=false;
      break;
   

    default:
      console.warn('Choix inconnu :', this.choixInventaire);
      break;
  }
    this.resetForm();
  }

  chargerInventaire(): void {
    if (this.inventaireForm.invalid) {
      this.toastr.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    const formValue = this.inventaireForm.value;

    let observable;
    
    switch (this.choixInventaire) {
      case ChoixInventaire.BOUTIQUE:
        if (!formValue.boutique || !formValue.categorie) {
          this.toastr.error('Veuillez sélectionner une boutique et une catégorie');
          this.isLoading = false;
          return;
        }
        observable = this.inventaireService.chargerInventaire(formValue.boutique.id, formValue.categorie.id);
        
        break;
      
      case ChoixInventaire.DEPOT:
        if (!formValue.depot) {
          this.toastr.error('Veuillez sélectionner un dépôt');
          this.isLoading = false;
          return;
        }
        observable = this.inventaireService.chargerInventaireParDepot(formValue.depot.id);
        break;
      
      case ChoixInventaire.DATE:
        if (!formValue.dateInventaire) {
          this.toastr.error('Veuillez sélectionner une date');
          this.isLoading = false;
          return;
        }
        observable = this.inventaireService.chargerInventaireParDate(formValue.dateInventaire);
        break;
      
      default:
        this.toastr.error('Choix non valide');
        this.isLoading = false;
        return;
    }

    observable.subscribe({
      next: (data) => {
        this.inventaires = data;
        this.filteredInventaires = data;
        this.totalItems = data.length;
        this.calculateTotal();
        this.isLoading = false;
        this.toastr.success('Inventaire chargé avec succès');
      },
      error: (error) => {
        this.toastr.error('Erreur lors du chargement de l\'inventaire');
        this.isLoading = false;
      }
    });
  }

  editInventaire(inventaire: Inventaire): void {
    this.selectedInventaire = { ...inventaire };
    this.isEditing = true;
    this.inventaireForm.patchValue({
      prix: inventaire.prix
    });
  }

  updatePrixAchat(): void {
    if (!this.selectedInventaire || this.inventaireForm.get('prix')?.invalid) {
      this.toastr.error('Prix non valide');
      return;
    }

    const nouveauPrix = this.inventaireForm.get('prix')?.value;
    this.selectedInventaire.prix = nouveauPrix;
    this.selectedInventaire.total = this.selectedInventaire.quantite * nouveauPrix;

    this.inventaireService.updateInventaire(this.selectedInventaire.id!, this.selectedInventaire).subscribe({
      next: (data) => {
        const index = this.inventaires.findIndex(i => i.id === data.id);
        if (index !== -1) {
          this.inventaires[index] = data;
          this.filteredInventaires = [...this.inventaires];
          this.calculateTotal();
        }
        this.resetForm();
        this.toastr.success('Prix mis à jour avec succès');
      },
      error: (error) => {
        this.toastr.error('Erreur lors de la mise à jour du prix');
      }
    });
  }

  resetForm(): void {
    this.selectedInventaire = null;
    this.isEditing = false;
    this.inventaireForm.get('prix')?.setValue(0);
  }

  onSearch(): void {
    if (!this.searchText.trim()) {
      this.filteredInventaires = this.inventaires;
    } else {
      this.filteredInventaires = this.inventaires.filter(inventaire =>
        inventaire.produit.reference.toLowerCase().includes(this.searchText.toLowerCase()) ||
        inventaire.produit.libelle.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
    this.totalItems = this.filteredInventaires.length;
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onItemsPerPageChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.itemsPerPage = value;
    this.currentPage = 1;
  }

  get paginatedInventaires(): Inventaire[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInventaires.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get montantTotal(): number {
    console.log(this.filteredInventaires);
    return this.filteredInventaires.reduce((sum, inventaire) => sum + inventaire.total, 0);
  }

  private calculateTotal(): void {
    // Le montant total est calculé automatiquement via le getter
  }

  print(): void {
    const filter: InventaireFilter = {
      // Construire le filtre basé sur les critères actuels
    };

    this.inventaireService.printInventaire(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventaire_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastr.error('Erreur lors de l\'impression');
      }
    });
  }

  refresh(): void {
    this.resetForm();
    this.inventaires = [];
    this.filteredInventaires = [];
    this.totalItems = 0;
    this.currentPage = 1;
    this.searchText = '';
    this.toastr.info('Formulaire réinitialisé');
  }

  trackByInventaire(index: number, item: Inventaire): number {
    return item.id || index;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5; // Nombre maximum de pages à afficher
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Propriété pour le template
  get Math() {
    return Math;
  }
}
