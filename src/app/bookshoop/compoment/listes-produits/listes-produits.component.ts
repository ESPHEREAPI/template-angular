import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Produit } from '../../model/produit';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listes-produits',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './listes-produits.component.html',
  styleUrl: './listes-produits.component.css'
})
export class ListesProduitsComponent implements OnInit, OnChanges, OnDestroy {

  @Input() placeholder: string = 'Rechercher un article...';
  @Input() articles: Produit[] = [];
  @Output() articleSelected = new EventEmitter<Produit>();
  
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  searchControl = new FormControl('');
  filteredArticles$ = new BehaviorSubject<Produit[]>([]);
  loading = false;
  isDropdownOpen = false;
  selectedArticle: Produit | null = null;
  
  // Pour la virtualisation
  itemHeight = 35;
  containerHeight = 300;
  visibleItems = Math.floor(this.containerHeight / this.itemHeight);
  scrollTop = 0;
  startIndex = 0;
  endIndex = this.visibleItems;
  
  private destroy$ = new Subject<void>();
  
  // ✅ CHANGÉ DE private À public (ou simplement sans modificateur)
  allArticles: Produit[] = [];
  
  ngOnInit() {
    console.log('🔧 ListesProduits - Initialisation avec', this.articles.length, 'articles');
    this.allArticles = [...this.articles];
    this.setupSearch();
    this.filteredArticles$.next(this.articles.slice(0, 50));
  }
  
  // ✅ AJOUT DE ngOnChanges pour détecter les changements
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['articles']) {
      const currentArticles = changes['articles'].currentValue;
      const previousArticles = changes['articles'].previousValue;
      
      console.log('🔄 ListesProduits - Changement détecté!');
      console.log('📊 Ancien nombre:', previousArticles?.length || 0);
      console.log('📊 Nouveau nombre:', currentArticles?.length || 0);
      
      if (currentArticles) {
        // ✅ Mettre à jour allArticles avec les nouveaux articles
        this.allArticles = [...currentArticles];
        
        // ✅ Mettre à jour les articles filtrés
        const currentSearchTerm = this.searchControl.value || '';
        if (currentSearchTerm.trim()) {
          // Si une recherche est en cours, réappliquer le filtre
          this.filterArticles(currentSearchTerm);
        } else {
          // Sinon, afficher les 50 premiers
          this.filteredArticles$.next(currentArticles.slice(0, 50));
        }
        
        console.log('✅ allArticles mis à jour:', this.allArticles.length);
      }
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupSearch() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filterArticles(searchTerm || '');
    });
  }
  
  private filterArticles(searchTerm: string) {
    this.loading = true;
    
    setTimeout(() => {
      let filtered: Produit[];
      
      if (!searchTerm.trim()) {
        filtered = this.allArticles.slice(0, 50);
      } else {
        const term = searchTerm.toLowerCase().trim();
        filtered = this.allArticles.filter(article => 
          article.libelle.toLowerCase().includes(term) ||
          (article.reference && article.reference.toLowerCase().includes(term)) ||
          (article.description && article.description.toLowerCase().includes(term))
        ).slice(0, 100);
      }
      
      console.log('🔍 Filtrage:', searchTerm, '- Résultats:', filtered.length);
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
  
  getVisibleItems(): Produit[] {
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
  
  selectArticle(article: Produit) {
    console.log('✅ Article sélectionné:', article.libelle);
    this.selectedArticle = article;
    this.searchControl.setValue(article.libelle);
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
    setTimeout(() => {
      this.isDropdownOpen = false;
    }, 200);
  }
}