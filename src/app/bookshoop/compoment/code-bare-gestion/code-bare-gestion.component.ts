import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Barcodeproduit } from '../../model/barcodeproduit';
import { BarcodeGestionService, BarcodeCreateRequest } from '../../service/BarcodeGestion.service';
import { ReferenceDataService } from '../../service/reference-data.service';
import { BarcodeService } from '../../service/barcode.service';
import { Boutique } from '../../model/boutique';
import { Produit } from '../../model/produit';

declare var $: any;

@Component({
  selector: 'app-code-bare-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-bare-gestion.component.html',
  styleUrls: ['./code-bare-gestion.component.css']
})
export class CodeBareGestionComponent implements OnInit {
  barcodes: Barcodeproduit[] = [];
  newBarcode: BarcodeCreateRequest = this.emptyBarcode();
  editingId: number | null = null;
  editingCode: string = '';

  // Listes de selection - remplacent la saisie manuelle d'ID numeriques
  // (l'utilisateur choisit une boutique puis un article par leur nom, pas
  // par un identifiant qu'il devrait aller chercher ailleurs).
  boutiques: Boutique[] = [];
  articlesDeLaBoutique: Produit[] = [];
  chargementArticles = false;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private barcodeGestionService: BarcodeGestionService,
    private referenceDataService: ReferenceDataService,
    private barcodeService: BarcodeService
  ) {}

  ngOnInit(): void {
    this.loadBarcodes();
    this.chargerBoutiques();
  }

  private chargerBoutiques(): void {
    this.referenceDataService.getBoutiques()
      .subscribe({
        next: (data) => this.boutiques = data,
        error: (error) => {
          console.error('Erreur lors du chargement des boutiques', error);
          this.showToast('Erreur lors du chargement des boutiques', 'error');
        }
      });
  }

  // Appele quand l'utilisateur choisit une boutique dans le formulaire :
  // charge les articles DE CETTE boutique pour le second selecteur.
  onBoutiqueChange(): void {
    this.newBarcode.produitId = 0;
    this.articlesDeLaBoutique = [];
    if (!this.newBarcode.boutiqueId) return;

    this.chargementArticles = true;
    this.barcodeService.getProduitsAutoComplet(this.newBarcode.boutiqueId)
      .subscribe({
        next: (produits) => {
          this.articlesDeLaBoutique = produits;
          this.chargementArticles = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des articles', error);
          this.showToast('Erreur lors du chargement des articles de la boutique', 'error');
          this.chargementArticles = false;
        }
      });
  }

  emptyBarcode(): BarcodeCreateRequest {
    return { codeBard: '', produitId: 0, boutiqueId: 0 };
  }

  loadBarcodes(): void {
    this.barcodeGestionService.getAll(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.barcodes = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des codes-barres', error);
          this.showToast('Erreur de chargement', 'error');
        }
      });
  }

  openModal(): void {
    this.newBarcode = this.emptyBarcode();
    this.articlesDeLaBoutique = [];
    $('#barcodeModal').modal('show');
  }

  saveBarcode(): void {
    this.barcodeGestionService.create(this.newBarcode)
      .subscribe({
        next: () => {
          this.loadBarcodes();
          $('#barcodeModal').modal('hide');
          this.showToast('Code-barres associé avec succès', 'success');
        },
        error: (error) => {
          console.error('Erreur lors de la création', error);
          const message = error?.error?.message || 'Erreur de création';
          this.showToast(message, 'error');
        }
      });
  }

  startEdit(barcode: Barcodeproduit): void {
    this.editingId = barcode.id ?? null;
    this.editingCode = barcode.codeBard;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingCode = '';
  }

  saveEdit(id: number): void {
    this.barcodeGestionService.update(id, this.editingCode)
      .subscribe({
        next: () => {
          this.loadBarcodes();
          this.cancelEdit();
          this.showToast('Code-barres modifié avec succès', 'success');
        },
        error: (error) => {
          console.error('Erreur lors de la modification', error);
          this.showToast('Erreur de modification', 'error');
        }
      });
  }

  deleteBarcode(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) {
      this.barcodeGestionService.delete(id)
        .subscribe({
          next: () => {
            this.loadBarcodes();
            this.showToast('Association supprimée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.showToast('Erreur de suppression', 'error');
          }
        });
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadBarcodes();
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i);
  }

  showToast(message: string, type: string): void {
    $(document).Toasts('create', {
      title: type === 'success' ? 'Succès' : 'Erreur',
      body: message,
      class: type === 'success' ? 'bg-success' : 'bg-danger',
      autohide: true,
      delay: 3000
    });
  }
}
