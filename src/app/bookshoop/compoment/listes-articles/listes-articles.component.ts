import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { PrixArticles } from '../../model/prix-articles';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listes-articles',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule ],
  templateUrl: './listes-articles.component.html',
  styleUrl: './listes-articles.component.css'
})
export class ListesArticlesComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Rechercher un article...';
  @Input() articles: PrixArticles[] = [];
  @Output() articleSelected = new EventEmitter<PrixArticles>();
  
  @ViewChild('searchInput') searchInput!: ElementRef;

   
  searchControl = new FormControl('');
  filteredArticles$ = new BehaviorSubject<PrixArticles[]>([]);
  loading = false;
  isDropdownOpen = false;
  selectedArticle: PrixArticles | null = null;
  
  // Pour la virtualisation
  itemHeight = 35;
  containerHeight = 300;
  visibleItems = Math.floor(this.containerHeight / this.itemHeight);
  scrollTop = 0;
  startIndex = 0;
  endIndex = this.visibleItems;
  
  private destroy$ = new Subject<void>();
  private allArticles: PrixArticles[] = [];
  
  ngOnInit() {
    this.allArticles = [...this.articles];
    this.setupSearch();
    this.filteredArticles$.next(this.articles.slice(0, 50)); // Afficher seulement les 50 premiers au début
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupSearch() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300), // Attendre 300ms après la dernière frappe
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterArticles(searchTerm || '');
    });
  }
  
  private filterArticles(searchTerm: string) {
    this.loading = true;
    
    // Utiliser setTimeout pour ne pas bloquer l'UI
    setTimeout(() => {
      let filtered: PrixArticles[];
      
      if (!searchTerm.trim()) {
        // Si pas de recherche, afficher seulement les 50 premiers
        filtered = this.allArticles.slice(0, 50);
      } else {
        // Recherche optimisée
        const term = searchTerm.toLowerCase().trim();
        filtered = this.allArticles.filter(article => 
          article.pointVente.produit.libelle.toLowerCase().includes(term) ||
          ( article.pointVente.produit.reference && article.pointVente.produit.reference.toLowerCase().includes(term)) ||
          (article.pointVente.produit.description && article.pointVente.produit.description.toLowerCase().includes(term))
        ).slice(0, 100); // Limiter à 100 résultats max
      }
      
      this.filteredArticles$.next(filtered);
      this.resetVirtualScroll();
      this.loading = false;
    }, 0);
  }
  
  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    this.scrollTop = target.scrollTop;
    this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
    this.endIndex = Math.min(this.startIndex + this.visibleItems + 5, this.filteredArticles$.value.length);
  }
  
  getVisibleItems(): PrixArticles[] {
    return this.filteredArticles$.value.slice(this.startIndex, this.endIndex);
  }
  
  getTransformStyle(): string {
    return `translateY(${this.startIndex * this.itemHeight}px)`;
  }
  
  getTotalHeight(): number {
    return this.filteredArticles$.value.length * this.itemHeight;
  }
  
  private resetVirtualScroll() {
    this.scrollTop = 0;
    this.startIndex = 0;
    this.endIndex = Math.min(this.visibleItems, this.filteredArticles$.value.length);
  }
  
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
    }
  }
  
  selectArticle(article: PrixArticles) {
    this.selectedArticle = article;
    this.searchControl.setValue(article.pointVente.produit.libelle);
    this.isDropdownOpen = false;
    this.articleSelected.emit(article);
  }
  
  clearSelection() {
    this.selectedArticle = null;
    this.searchControl.setValue('');
    this.filterArticles('');
  }
  
  onInputFocus() {
    this.isDropdownOpen = true;
  }
  
  onInputBlur() {
    // Délai pour permettre la sélection d'un élément
    setTimeout(() => {
      this.isDropdownOpen = false;
    }, 200);
  }

}
