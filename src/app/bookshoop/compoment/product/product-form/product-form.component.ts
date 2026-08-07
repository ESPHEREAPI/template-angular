import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../services/product.service';
import { Supplier } from '../../../../model/supplier';
import { Product } from '../../../../model/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
   @Input() product: Product | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  productForm!: FormGroup;
  suppliers: Supplier[] = [];
  loading = false;
  error = '';
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.isEditMode = !!this.product;
    this.initForm();
    this.loadSuppliers();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: [this.product?.name || '', [Validators.required, Validators.maxLength(100)]],
      description: [this.product?.description || ''],
      category: [this.product?.category || '', Validators.required],
      buyPrice: [this.product?.buyPrice || 0, [Validators.required, Validators.min(0)]],
      sellPrice: [this.product?.sellPrice || 0, [Validators.required, Validators.min(0)]],
      quantity: [this.product?.quantity || 0, [Validators.required, Validators.min(0)]],
      minQuantity: [this.product?.minQuantity || 0, [Validators.required, Validators.min(0)]],
      image: [this.product?.image || ''],
      barcode: [this.product?.barcode || ''],
      supplierId: [this.product?.supplierId || null]
    });
  }

  private loadSuppliers(): void {
    // Simulation - dans une application réelle, vous devriez avoir un service pour les fournisseurs
    this.suppliers = [
      { id: 1, name: 'Fournisseur A', phone: '0123456789', contactName:'nom du contact',email:'email',address:'adresse'},
      { id: 2, name: 'Fournisseur B', phone: '9876543210' , contactName:'nom du contact',email:'email',address:'adresse'},
      { id: 3, name: 'Fournisseur C', phone: '0123498765', contactName:'nom du contact',email:'email',address:'adresse' }
    ];
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    const productData: Product = {
      ...this.productForm.value
    };

    if (this.isEditMode && this.product?.id) {
      productData.id = this.product.id;
      this.updateProduct(productData);
    } else {
      this.addProduct(productData);
    }
  }

  addProduct(product: Product): void {
    this.loading = true;
    this.productService.addProduct(product).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'ajout du produit.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  updateProduct(product: Product): void {
    this.loading = true;
    this.productService.updateProduct(product).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (err) => {
        this.error = 'Erreur lors de la mise à jour du produit.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.canceled.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

}
