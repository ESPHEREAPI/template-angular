import { Component, OnInit } from '@angular/core';


import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductFormComponent } from '../product-form/product-form.component';

import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../model/product';
import { TransferStockComponent } from '../transfer-stock/transfer-stock.component';


@Component({
  selector: 'app-produc-list',
  standalone: true,
  imports: [CommonModule,ProductFormComponent,TransferStockComponent],
  templateUrl: './produc-list.component.html',
  styleUrl: './produc-list.component.css'
})
export class ProducListComponent implements OnInit {

   products: Product[] = [];
  selectedProduct: Product | null = null;
  showAddForm = false;
  showEditForm = false;
  showTransferForm = false;
  loading = true;
  error = '';

  constructor(
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des produits.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.showEditForm = false;
    this.showTransferForm = false;
    this.selectedProduct = null;
  }

  openEditForm(product: Product): void {
    this.selectedProduct = { ...product };
    this.showEditForm = true;
    this.showAddForm = false;
    this.showTransferForm = false;
  }

  openTransferForm(product: Product): void {
    this.selectedProduct = { ...product };
    this.showTransferForm = true;
    this.showAddForm = false;
    this.showEditForm = false;
  }

  closeForm(): void {
    this.showAddForm = false;
    this.showEditForm = false;
    this.showTransferForm = false;
    this.selectedProduct = null;
  }

  onProductSaved(): void {
    this.closeForm();
    this.loadProducts();
  }

  onTransferComplete(): void {
    this.closeForm();
    this.loadProducts();
  }

  deleteProduct(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression du produit.';
          console.error(err);
        }
      });
    }
  }

}
