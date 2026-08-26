import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Barcodeproduit } from '../../model/barcodeproduit';
import { BarcodeGestionService, BarcodeCreateRequest } from '../../service/BarcodeGestion.service';
import { ReferenceDataService } from '../../service/reference-data.service';
import { BarcodeService } from '../../service/barcode.service';
import { Boutique } from '../../model/boutique';
import { Produit } from '../../model/produit';
import { CodeBareOfflineService } from '../../service/code-bare-offline.service';
import { SyncStatusBadgeComponent, SyncStatusView } from '../sync-status-badge/sync-status-badge.component';

declare var $: any;

@Component({
  selector: 'app-code-bare-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, SyncStatusBadgeComponent],
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

  readonly syncStatus$: Observable<SyncStatusView>;

  constructor(
    private barcodeGestionService: BarcodeGestionService,
    private referenceDataService: ReferenceDataService,
    private barcodeService: BarcodeService,
    private codeBareOfflineService: CodeBareOfflineService
  ) {
    this.syncStatus$ = this.codeBareOfflineService.status$;
  }

  ngOnInit(): void {
    this.codeBareOfflineService.configurerPing();
    this.loadBarcodes();
    this.chargerBoutiques();
  }

  forceSyncNow(): void {
    this.codeBareOfflineService.forceSyncNow().then(() => this.loadBarcodes());
  }

  private chargerBoutiques(): void {
    this.referenceDataService.getBoutiques()
      .subscribe({
        next: (data) => {
          this.boutiques = data;
          this.codeBareOfflineService.cacheBoutiques(data);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des boutiques, utilisation du cache local', error);
          this.boutiques = this.codeBareOfflineService.getCachedBoutiques();
          if (this.boutiques.length === 0) {
            this.showToast('Erreur lors du chargement des boutiques', 'error');
          }
        }
      });
  }

  // Appele quand l'utilisateur choisit une boutique dans le formulaire :
  // charge les articles DE CETTE boutique pour le second selecteur.
  onBoutiqueChange(): void {
    this.newBarcode.produitId = 0;
    this.articlesDeLaBoutique = [];
    if (!this.newBarcode.boutiqueId) return;

    const boutiqueId = this.newBarcode.boutiqueId;
    this.chargementArticles = true;
    this.barcodeService.getProduitsAutoComplet(boutiqueId)
      .subscribe({
        next: (produits) => {
          this.articlesDeLaBoutique = produits;
          this.chargementArticles = false;
          this.codeBareOfflineService.cacheArticlesBoutique(boutiqueId, produits);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des articles, utilisation du cache local', error);
          this.articlesDeLaBoutique = this.codeBareOfflineService.getCachedArticlesBoutique(boutiqueId);
          this.chargementArticles = false;
          if (this.articlesDeLaBoutique.length === 0) {
            this.showToast('Erreur lors du chargement des articles de la boutique', 'error');
          }
        }
      });
  }

  emptyBarcode(): BarcodeCreateRequest {
    return { codeBard: '', produitId: 0, boutiqueId: 0 };
  }

  // Fusionne la page recue du serveur avec les operations pas encore
  // synchronisees (voir CodeBareOfflineService) : creations en attente
  // ajoutees en tete (page 0 seulement - une creation locale n'a pas de
  // position reelle dans la pagination serveur), modifications en attente
  // affichees avec leur nouvelle valeur, suppressions en attente masquees.
  async loadBarcodes(): Promise<void> {
    this.barcodeGestionService.getAll(this.currentPage, this.pageSize)
      .subscribe({
        next: async (response) => {
          const modifications = await this.codeBareOfflineService.getModificationsEnAttente();

          let barcodes = response.content.filter(b => !(b.id !== undefined && modifications.get(b.id)?.supprime));
          barcodes = barcodes.map(b => {
            const mod = b.id !== undefined ? modifications.get(b.id) : undefined;
            return mod && !mod.supprime && mod.codeBard !== undefined
              ? { ...b, codeBard: mod.codeBard, pending: true }
              : b;
          });

          if (this.currentPage === 0) {
            const pendingRows = await this.codeBareOfflineService.getPendingRows();
            const enAttente: Barcodeproduit[] = pendingRows.map(row => ({
              id: row.id,
              codeBard: row.codeBard,
              pending: true,
              prixArticles: {
                pointVente: {
                  produit: { libelle: row.produitLibelle, reference: row.produitReference }
                }
              }
            }));
            barcodes = [...enAttente, ...barcodes];
          }

          this.barcodes = barcodes;
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

  async saveBarcode(): Promise<void> {
    const produit = this.articlesDeLaBoutique.find(p => p.id === this.newBarcode.produitId);
    try {
      await this.codeBareOfflineService.creer(this.newBarcode, produit?.libelle, produit?.reference);
      this.loadBarcodes();
      $('#barcodeModal').modal('hide');
      this.showToast('Code-barres associé avec succès', 'success');
    } catch (error: any) {
      console.error('Erreur lors de la création', error);
      const message = error?.error?.message || 'Erreur de création';
      this.showToast(message, 'error');
    }
  }

  startEdit(barcode: Barcodeproduit): void {
    this.editingId = barcode.id ?? null;
    this.editingCode = barcode.codeBard;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingCode = '';
  }

  async saveEdit(id: number): Promise<void> {
    try {
      await this.codeBareOfflineService.modifier(id, this.editingCode);
      this.loadBarcodes();
      this.cancelEdit();
      this.showToast('Code-barres modifié avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la modification', error);
      this.showToast('Erreur de modification', 'error');
    }
  }

  async deleteBarcode(id: number): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) {
      try {
        await this.codeBareOfflineService.supprimer(id);
        this.loadBarcodes();
        this.showToast('Association supprimée avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression', error);
        this.showToast('Erreur de suppression', 'error');
      }
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
