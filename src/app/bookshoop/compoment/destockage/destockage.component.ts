import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { Produit } from '../../model/produit';
import { BoutiqueService } from '../../service/boutique.service';
import { DestockageService } from '../../service/Destockage.service';
import { BarcodeService } from '../../service/barcode.service';

declare var $: any;

@Component({
  selector: 'app-destockage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './destockage.component.html',
  styleUrls: ['./destockage.component.css']
})
export class DestockageComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  articleId: number | null = null;
  quantite: number | null = null;
  nouveauStock: number | null = null;
  enCours = false;

  // Liste des articles de la boutique choisie - evite de devoir saisir un
  // ID numerique a la main (l'utilisateur choisit par reference/libelle).
  articlesDeLaBoutique: Produit[] = [];
  chargementArticles = false;

  constructor(
    private boutiqueService: BoutiqueService,
    private destockageService: DestockageService,
    private barcodeService: BarcodeService
  ) {}

  ngOnInit(): void {
    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
  }

  onBoutiqueChange(): void {
    this.articleId = null;
    this.articlesDeLaBoutique = [];
    if (!this.boutiqueId) return;

    this.chargementArticles = true;
    this.barcodeService.getProduitsAutoComplet(this.boutiqueId)
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

  destocker(): void {
    if (!this.boutiqueId || !this.articleId || !this.quantite || this.quantite <= 0) {
      this.showToast('Veuillez renseigner la boutique, l\'article et une quantité valide', 'error');
      return;
    }

    this.enCours = true;
    this.destockageService.decrementerStock(this.articleId, this.boutiqueId, this.quantite)
      .subscribe({
        next: (nouveauStock) => {
          this.nouveauStock = nouveauStock;
          this.enCours = false;
          this.showToast('Destockage effectué avec succès', 'success');
        },
        error: (error) => {
          this.enCours = false;
          console.error('Erreur lors du destockage', error);
          const message = error?.status === 400
            ? 'Article introuvable ou stock insuffisant'
            : 'Erreur lors du destockage';
          this.showToast(message, 'error');
        }
      });
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
