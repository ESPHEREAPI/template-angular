import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  ApercuImportStock,
  ChampImportStock,
  LIBELLE_CHAMP_IMPORT_STOCK,
  ModeRestauration,
  StockImportFormat
} from '../../model/stock-import-format';
import { Boutique } from '../../model/boutique';
import { StockImportService } from '../../service/stock-import.service';
import { ReferenceDataService } from '../../service/reference-data.service';

const TOUS_LES_CHAMPS: ChampImportStock[] = ['REFERENCE', 'PRODUIT', 'CATEGORIE', 'PRIX_VENTE', 'PRIX_ACHAT', 'BOUTIQUE', 'QUANTITE'];

/**
 * "Initialisation Stock" (module Administration) : chaque compagnie
 * construit elle-meme le format de son fichier de restauration de stock
 * (onglet Format), puis l'utilise pour restaurer le stock d'une ou
 * plusieurs boutiques (onglet Restauration) - voir StockImportService.
 */
@Component({
  selector: 'app-stock-import-format',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-import-format.component.html',
  styleUrl: './stock-import-format.component.css'
})
export class StockImportFormatComponent implements OnInit {
  ongletActif: 'format' | 'restauration' = 'format';
  libelleChamp = LIBELLE_CHAMP_IMPORT_STOCK;
  tousLesChamps = TOUS_LES_CHAMPS;

  // Onglet Format
  colonnes: ChampImportStock[] = [];
  nouveauChamp: ChampImportStock | '' = '';
  chargementFormat = true;
  enregistrementFormat = false;

  // Onglet Restauration
  boutiques: Boutique[] = [];
  boutiqueSelectionneeId: number | null = null;
  mode: ModeRestauration = 'AJOUT';
  fichierSelectionne: File | null = null;
  apercu: ApercuImportStock | null = null;
  chargementApercu = false;
  applicationEnCours = false;

  constructor(
    private stockImportService: StockImportService,
    private referenceDataService: ReferenceDataService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.chargerFormat();
    this.referenceDataService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques:', error)
    });
  }

  get boutiqueDansFormat(): boolean {
    return this.colonnes.includes('BOUTIQUE');
  }

  get champsDisponibles(): ChampImportStock[] {
    return this.tousLesChamps.filter(c => !this.colonnes.includes(c));
  }

  changerOnglet(onglet: 'format' | 'restauration'): void {
    this.ongletActif = onglet;
  }

  // --- Format ---

  chargerFormat(): void {
    this.chargementFormat = true;
    this.stockImportService.getFormat().subscribe({
      next: (format) => {
        this.colonnes = format.colonnes ?? [];
        this.chargementFormat = false;
      },
      error: (error) => {
        this.chargementFormat = false;
        this.toastr.error('Erreur lors du chargement du format.');
        console.error(error);
      }
    });
  }

  ajouterColonne(): void {
    if (!this.nouveauChamp) { return; }
    this.colonnes.push(this.nouveauChamp);
    this.nouveauChamp = '';
  }

  retirerColonne(index: number): void {
    this.colonnes.splice(index, 1);
  }

  monterColonne(index: number): void {
    if (index <= 0) { return; }
    [this.colonnes[index - 1], this.colonnes[index]] = [this.colonnes[index], this.colonnes[index - 1]];
  }

  descendreColonne(index: number): void {
    if (index >= this.colonnes.length - 1) { return; }
    [this.colonnes[index + 1], this.colonnes[index]] = [this.colonnes[index], this.colonnes[index + 1]];
  }

  enregistrerFormat(): void {
    if (!this.colonnes.includes('REFERENCE')) {
      this.toastr.error('Le format doit inclure la colonne Référence.');
      return;
    }
    if (!this.colonnes.includes('QUANTITE')) {
      this.toastr.error('Le format doit inclure la colonne Quantité.');
      return;
    }
    this.enregistrementFormat = true;
    const format: StockImportFormat = { colonnes: this.colonnes };
    this.stockImportService.updateFormat(format).subscribe({
      next: (saved) => {
        this.colonnes = saved.colonnes ?? [];
        this.enregistrementFormat = false;
        this.toastr.success('Format enregistré.');
        this.apercu = null;
      },
      error: (error) => {
        this.enregistrementFormat = false;
        this.toastr.error(error?.error?.message || "Erreur lors de l'enregistrement du format.");
        console.error(error);
      }
    });
  }

  // --- Restauration ---

  telechargerModele(): void {
    this.stockImportService.telechargerModele(this.boutiqueDansFormat ? null : this.boutiqueSelectionneeId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modele-restauration-stock.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastr.error(error?.error?.message || 'Erreur lors du téléchargement du modèle.');
        console.error(error);
      }
    });
  }

  onFichierChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fichierSelectionne = input.files && input.files.length > 0 ? input.files[0] : null;
    this.apercu = null;
  }

  previsualiser(): void {
    if (!this.fichierSelectionne) {
      this.toastr.error('Sélectionnez un fichier.');
      return;
    }
    if (!this.boutiqueDansFormat && !this.boutiqueSelectionneeId) {
      this.toastr.error('Sélectionnez une boutique.');
      return;
    }
    this.chargementApercu = true;
    this.stockImportService.previsualiser(this.fichierSelectionne, this.boutiqueSelectionneeId, this.mode).subscribe({
      next: (apercu) => {
        this.apercu = apercu;
        this.chargementApercu = false;
      },
      error: (error) => {
        this.chargementApercu = false;
        this.toastr.error(error?.error?.message || 'Erreur lors de la prévisualisation.');
        console.error(error);
      }
    });
  }

  confirmerEtAppliquer(): void {
    if (!this.fichierSelectionne || !this.apercu || this.apercu.hasErreurs) { return; }
    this.applicationEnCours = true;
    this.stockImportService.appliquer(this.fichierSelectionne, this.boutiqueSelectionneeId, this.mode).subscribe({
      next: (resultat) => {
        this.applicationEnCours = false;
        if (resultat.lignesEnErreur > 0) {
          this.toastr.warning(
            `${resultat.lignesAppliquees} ligne(s) appliquée(s), ${resultat.lignesEnErreur} en échec ` +
            `(${resultat.referencesEnErreur.slice(0, 10).join(', ')}${resultat.referencesEnErreur.length > 10 ? '…' : ''}).`,
            'Restauration partiellement appliquée'
          );
        } else {
          this.toastr.success(`Restauration de stock appliquée (${resultat.lignesAppliquees} ligne(s)).`);
        }
        this.apercu = null;
        this.fichierSelectionne = null;
      },
      error: (error) => {
        this.applicationEnCours = false;
        this.toastr.error(error?.error?.message || "Erreur lors de l'application de la restauration.");
        console.error(error);
      }
    });
  }
}
