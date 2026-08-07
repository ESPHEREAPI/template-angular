import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ItemProduct } from '../../model/Item-Product';
import { CaddyService } from '../../service/caddy.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-caddies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './caddies.component.html',
  styleUrls: ['./caddies.component.css']
})
export class CaddiesComponent implements OnInit {
  itemproduct!: Array<ItemProduct>;
  first = 0;
  row = 10;
  totalPrice: number = 0;

  constructor(public caddiservice: CaddyService, private route: Router) {
    let caddy = localStorage.getItem("caddy");
    if (!caddy) {
      this.itemproduct = [];
    }

    this.route.events.subscribe(event => {
      console.log('Router Event:', event);
    });
  }

  ngOnInit(): void {
    this.itemproduct = this.caddiservice.getCurrentcaddy().itemsProducts;
    this.calculateTotalPrice();
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.itemproduct.reduce((sum, ip) => sum + (ip.price * ip.quantite), 0);
  }

  // Méthodes de pagination améliorées
  next(): void { 
    if (!this.isLastPage()) {
      this.first += this.row; 
    }
  }

  preview(): void { 
    if (!this.isFirstPage()) {
      this.first -= this.row; 
    }
  }

  reset(): void { 
    this.first = 0; 
  }

  goToFirstPage(): void {
    this.first = 0;
  }

  goToLastPage(): void {
    const totalPages = this.getTotalPages();
    this.first = (totalPages - 1) * this.row;
  }

  goToPage(page: number): void {
    this.first = (page - 1) * this.row;
  }

  onRowsPerPageChange(): void {
    this.first = 0; // Reset à la première page
  }

  // Méthodes utilitaires pour la pagination
  getCurrentPage(): number {
    return Math.floor(this.first / this.row) + 1;
  }

  getTotalPages(): number {
    return Math.ceil(this.getTotalItems() / this.row);
  }

  getTotalItems(): number {
    return this.itemproduct ? this.itemproduct.length : 0;
  }

  getTotalQuantity(): number {
    return this.itemproduct ? this.itemproduct.reduce((sum, item) => sum + item.quantite, 0) : 0;
  }

  getDisplayStart(): number {
    return this.getTotalItems() === 0 ? 0 : this.first + 1;
  }

  getDisplayEnd(): number {
    const end = this.first + this.row;
    return end > this.getTotalItems() ? this.getTotalItems() : end;
  }

  getPaginatedItems(): ItemProduct[] {
    if (!this.itemproduct) return [];
    const start = this.first;
    const end = start + this.row;
    return this.itemproduct.slice(start, end);
  }

  getVisiblePages(): number[] {
    const currentPage = this.getCurrentPage();
    const totalPages = this.getTotalPages();
    const visiblePages: number[] = [];
    
    // Logique pour afficher les pages visibles (maximum 5 pages)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajuster si on est près de la fin
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }
    
    return visiblePages;
  }

  isLastPage(): boolean {
    return this.itemproduct ? this.first >= this.itemproduct.length - this.row : true;
  }

  isFirstPage(): boolean {
    return this.itemproduct ? this.first === 0 : true;
  }

  // Méthodes de gestion du panier
  deleteCaddy(ip: ItemProduct): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.caddiservice.deleteCaddy(ip);
      this.itemproduct = this.caddiservice.getCurrentcaddy().itemsProducts;
      this.calculateTotalPrice();
      
      // Ajuster la pagination si nécessaire
      if (this.first >= this.itemproduct.length && this.first > 0) {
        this.first = Math.max(0, this.first - this.row);
      }
    }
  }

  incrementQuantity(ip: ItemProduct): void {
    const newQuantity = ip.quantite + 1;
    this.caddiservice.updateProductQuantity(ip.product.id, newQuantity);
    ip.quantite = newQuantity;
    this.calculateTotalPrice();
  }

  decrementQuantity(ip: ItemProduct): void {
    if (ip.quantite > 1) {
      const newQuantity = ip.quantite - 1;
      this.caddiservice.updateProductQuantity(ip.product.id, newQuantity);
      ip.quantite = newQuantity;
      this.calculateTotalPrice();
    }
  }

  updateQuantityFromInput(ip: ItemProduct, event: any): void {
    const newQuantity = parseInt(event.target.value, 10);
    if (newQuantity && newQuantity > 0) {
      this.caddiservice.updateProductQuantity(ip.product.id, newQuantity);
      ip.quantite = newQuantity;
      this.calculateTotalPrice();
    } else {
      // Restaurer la valeur précédente si invalide
      event.target.value = ip.quantite;
    }
  }

  // Méthode de tracking pour optimiser le rendu
  trackByProduct(index: number, item: ItemProduct): any {
    return item.product ? item.product.id : index;
  }

  // Navigation
  loadPageOrder(): void {
    if (this.getTotalItems() > 0) {
      this.route.navigateByUrl("order");
    } else {
      alert('Votre panier est vide. Ajoutez des produits avant de passer commande.');
    }
  }

  returnPageOrder(): void {
    this.route.navigateByUrl("e-com");
  }
}