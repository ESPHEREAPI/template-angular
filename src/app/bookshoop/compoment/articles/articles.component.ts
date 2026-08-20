import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Produit } from '../../model/produit';
import { Categorie } from '../../model/categorie';
import { Specification } from '../../model/specification';
import { ArticleSpecification } from '../../model/article-specification';
import { CommandeFournisseur } from '../../model/commande-fournisseur';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ArticleService } from '../../service/article.service';
import { ToastrService } from 'ngx-toastr';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ContentHeaderComponent } from '../../../content-header/content-header.component';
import { Subject, takeUntil } from 'rxjs';
import { PaginationResponse } from '../../model/pagination-response';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    ContentHeaderComponent
  ],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})
export class ArticlesComponent implements OnInit,OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  @ViewChild('fournisseurModal') fournisseurModal!: TemplateRef<any>;
  pageTitle: string = 'Articles';
  breadcrumbItems = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Articles', active: true }
  ];
  articleForm: FormGroup;
  articles: Produit[] = [];
  filteredArticles: Produit[] = [];
  categories: Categorie[] = [];
  specifiques: Specification[] = [];
  articleSpecifications: ArticleSpecification[] = [];
  fournisseurs: CommandeFournisseur[] = [];
    readonly Math = Math;

  selectedArticle: Produit | null = null;
  photoEnErreur = false;
  photoCacheBust = 0;
  currentPage = 0;
  //pageSize = 10;
  searchTerm = '';
  loading = false;
  activeTab = 'article';

  // Pagination
  // currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  pageSizeOptions = [5, 10, 20, 50, 100, 500, 1000];

  // Search
  // searchTerm = '';
  //filteredPrixArticles: PrixArticles[] = [];
  private deleteModalRef?: NgbModalRef;
  private fournisseurModalRef?: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {
    this.articleForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
  }
ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      reference: [''],
      libelle: ['', Validators.required],
      categories: [null, Validators.required],
      prixVenteModifiable: [false],
      pacquets: [false],
      quantiteByPacquet: [0],
      deletes: [false]
    });
  }

  private loadData(): void {
    this.loading = true;

    // Load articles
    /**  this.articleService.getArticles().subscribe({
       next: (articles) => {
         this.articles = articles;
         this.filteredArticles = articles;
         this.loading = false;
       },
       error: (error) => {
         this.toastr.error('Erreur lors du chargement des articles');
         this.loading = false;
       }
     });*/
console.log(this.searchTerm);
    this.articleService.getAllArticleByPage(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (articles) => {
        this.articles = articles.content;
        this.filteredArticles = articles.content;
        this.totalElements = articles.totalElements;
        this.currentPage = articles.page;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Erreur lors du chargement des articles');
        this.loading = false;
      }
    });

    // Load categories
    this.articleService.getCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: () => this.toastr.error('Erreur lors du chargement des catégories')
    });

    // Load specifiques
    this.articleService.getSpecifiques().subscribe({
      next: (specifiques) => this.specifiques = specifiques,
      error: () => this.toastr.error('Erreur lors du chargement des spécifiques')
    });
  }

  onSubmit(): void {
    if (this.articleForm.valid) {
      const article: Produit = this.articleForm.value;
      console.log(article);

      if (article.id) {
        this.updateArticle(article);
      } else {
        this.createArticle(article);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createArticle(article: Produit): void {
    this.articleService.createArticle(article).subscribe({
      next: (newArticle) => {
        this.articles.push(newArticle);
        this.applyFilter();
        this.resetForm();
        this.toastr.success('Article créé avec succès');
      },
      error: () => this.toastr.error('Erreur lors de la création de l\'article')
    });
  }

  private updateArticle(article: Produit): void {
    this.articleService.updateArticle(article).subscribe({
      next: (updatedArticle) => {
        const index = this.articles.findIndex(a => a.id === updatedArticle.id);
        if (index !== -1) {
          this.articles[index] = updatedArticle;
          this.applyFilter();
        }
        this.toastr.success('Article modifié avec succès');
      },
      error: () => this.toastr.error('Erreur lors de la modification de l\'article')
    });
  }

  editArticle(article: Produit): void {
    this.selectedArticle = article;
    this.articleForm.patchValue(article);
    this.loadArticleSpecifications(article.id!);
    this.activeTab = 'article';
    this.photoEnErreur = false;
    this.photoCacheBust = Date.now();
  }

  get photoUrl(): string {
    return this.selectedArticle?.id
      ? this.articleService.getPhotoUrl(this.selectedArticle.id, this.photoCacheBust)
      : '';
  }

  onPhotoSelectionnee(files: FileList | null): void {
    if (!files || files.length === 0 || !this.selectedArticle?.id) {
      return;
    }
    const file = files[0];
    this.articleService.uploadPhoto(this.selectedArticle.id, file).subscribe({
      next: () => {
        this.photoEnErreur = false;
        this.photoCacheBust = Date.now();
        this.toastr.success('Photo televersee avec succes');
      },
      error: (err) => {
        this.toastr.error(err?.error || 'Erreur lors du televersement de la photo');
      }
    });
  }

  supprimerPhoto(): void {
    if (!this.selectedArticle?.id) {
      return;
    }
    this.articleService.deletePhoto(this.selectedArticle.id).subscribe({
      next: () => {
        this.photoEnErreur = true;
        this.toastr.success('Photo supprimee');
      },
      error: () => this.toastr.error('Erreur lors de la suppression de la photo')
    });
  }

  confirmDelete(article: Produit): void {
    this.selectedArticle = article;
    this.deleteModalRef = this.modalService.open(this.deleteModal);
  }

  deleteArticle(): void {
    if (this.selectedArticle?.id) {
      this.articleService.deleteArticle(this.selectedArticle.id).subscribe({
        next: () => {
          this.articles = this.articles.filter(a => a.id !== this.selectedArticle!.id);
          this.applyFilter();
          this.resetForm();
          this.deleteModalRef?.close();
          this.toastr.success('Article supprimé avec succès');
        },
        error: () => this.toastr.error('Erreur lors de la suppression de l\'article')
      });
    }
  }

  showFournisseurs(article: Produit): void {
    this.selectedArticle = article;
    this.articleService.getFournisseursByArticle(article.id!).subscribe({
      next: (fournisseurs) => {
        this.fournisseurs = fournisseurs;
        this.fournisseurModalRef = this.modalService.open(this.fournisseurModal, { size: 'lg' });
      },
      error: () => this.toastr.error('Erreur lors du chargement des fournisseurs')
    });
  }

  private loadArticleSpecifications(articleId: number): void {
    this.articleService.getArticleSpecifications(articleId).subscribe({
      next: (specifications) => this.articleSpecifications = specifications,
      error: () => this.toastr.error('Erreur lors du chargement des spécifications')
    });
  }

  updateSpecification(specification: ArticleSpecification): void {
    this.articleService.updateArticleSpecification(specification).subscribe({
      next: () => this.toastr.success('Spécification mise à jour'),
      error: () => this.toastr.error('Erreur lors de la mise à jour de la spécification')
    });
  }

  resetForm(): void {
    this.articleForm.reset();
    this.selectedArticle = null;
    this.articleSpecifications = [];
    this.articleForm.patchValue({
      prixVenteModifiable: false,
      pacquets: false,
      quantiteByPacquet: 0,
      deletes: false
    });
  }

  refresh(): void {
    this.loadData();
    this.resetForm();
  }

  //onSearch(): void {
  //  this.applyFilter();
 // }

  private applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredArticles = [...this.articles];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredArticles = this.articles.filter(article =>
        article.reference?.toLowerCase().includes(searchLower) ||
        article.libelle.toLowerCase().includes(searchLower) ||
        article.categories?.libelle.toLowerCase().includes(searchLower)
      );
    }
  }

  //get paginatedArticles(): Produit[] {
  //  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //  return this.filteredArticles.slice(startIndex, startIndex + this.itemsPerPage);
  //}

 // get totalPages(): number {
    //return Math.ceil(this.filteredArticles.length / this.itemsPerPage);
 // }

  get isFormValid(): boolean {
    return this.articleForm.valid;
  }

  get isEditMode(): boolean {
    return !!this.articleForm.get('id')?.value;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.articleForm.controls).forEach(key => {
      this.articleForm.get(key)?.markAsTouched();
    });
  }

  onPacquetsChange(): void {
    const pacquetsControl = this.articleForm.get('pacquets');
    const quantiteControl = this.articleForm.get('quantiteByPacquet');

    if (pacquetsControl?.value) {
      quantiteControl?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      quantiteControl?.clearValidators();
      quantiteControl?.setValue(0);
    }
    quantiteControl?.updateValueAndValidity();
  }

  trackByFn(index: number, item: Produit): any {
    return item.id || index;
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

    // Ajuster si on est proche du début
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

   // Pagination et recherche
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadArticles(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadArticles(0);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.loadArticles(0);
  }

  private loadArticles(page: number = 0): void {
      this.articleService.getAllArticleByPage(page, this.pageSize, this.searchTerm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: PaginationResponse<Produit>) => {
            this.articles = response.content;
          //  this.filteredArticles= response.content;
            this.totalElements = response.totalElements;
            this.currentPage = response.page;
            this.loading = false;
          },
          error: (error) => {
            //this.handleError('Erreur lors du chargement des prix articles', error);
              this.toastr.error('Erreur lors du chargement des articles');
            this.loading = false;
          }
        });
    }
}
