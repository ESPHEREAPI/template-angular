import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
;
import { StoreLocation } from '../../../../model/store-location';
import { ProductService } from '../../../../services/product.service';
import { StockTransfer } from '../../../../model/stock-transfer';
import { Product } from '../../../../model/product';


@Component({
  selector: 'app-transfer-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfer-stock.component.html',
  styleUrl: './transfer-stock.component.css'
})
export class TransferStockComponent  implements OnInit{

   @Input() product!: Product;
  @Output() transferComplete = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  transferForm!: FormGroup;
  locations: StoreLocation[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadLocations();
  }

  private initForm(): void {
    this.transferForm = this.fb.group({
      fromLocationId: [null, Validators.required],
      toLocationId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(this.product.quantity)]],
      notes: ['']
    }, { validators: this.differentLocationsValidator });
  }

  differentLocationsValidator(group: FormGroup): { [key: string]: boolean } | null {
    const fromLocationId = group.get('fromLocationId')?.value;
    const toLocationId = group.get('toLocationId')?.value;
    
    if (fromLocationId && toLocationId && fromLocationId === toLocationId) {
      return { 'sameLocations': true };
    }
    
    return null;
  }

  private loadLocations(): void {
    this.productService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des points de vente.';
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (this.transferForm.invalid) {
      this.markFormGroupTouched(this.transferForm);
      return;
    }

    const formValues = this.transferForm.value;
    
    const stockTransfer: StockTransfer = {
      productId: this.product.id!,
      fromLocationId: formValues.fromLocationId,
      toLocationId: formValues.toLocationId,
      quantity: formValues.quantity,
      notes: formValues.notes,
      transferDate: new Date()
    };

    this.loading = true;
    this.error = '';
    this.success = '';

    this.productService.transferStock(stockTransfer).subscribe({
      next: () => {
        this.success = 'Transfert de stock effectué avec succès!';
        this.loading = false;
        
        // Afficher le message de succès pendant quelques secondes avant de fermer
        setTimeout(() => {
          this.transferComplete.emit();
        }, 2000);
      },
      error: (err) => {
        this.error = 'Erreur lors du transfert de stock.';
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
