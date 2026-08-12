import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Annee } from '../../model/annee';
import { Vente } from '../../model/vente';
import { CaisseItem } from '../../model/caisse-item';
import { Boutique } from '../../model/boutique';
import { TableColumn } from '../../model/table-column';
import { HistoriqueVenteService } from '../../service/historique-vente.service';
import { BoutiqueService } from '../../service/boutique.service';

// Metadonnees d'affichage par mode de paiement, identiques a
// historique-caisse.component.ts (memes valeurs d'enum backend TypePaiement).
interface ModePaiementMeta {
  label: string;
  color: string;
  icon: string;
  rowClass: string;
}

const MODE_PAIEMENT_META: { [mode: string]: ModePaiementMeta } = {
  ESPECES: { label: 'Espèces', color: 'success', icon: 'fas fa-money-bill-wave', rowClass: 'bg-green' },
  CARTE_BANCAIRE: { label: 'Carte Bancaire', color: 'info', icon: 'fas fa-credit-card', rowClass: 'table-info' },
  BON_ACHAT: { label: "Bon d'Achat", color: 'secondary', icon: 'fas fa-ticket-alt', rowClass: 'bg-purple' },
  MOBILE_MONEY: { label: 'MTN Money', color: 'primary', icon: 'fas fa-mobile-alt', rowClass: 'bg-yellow' },
  ORANGE_MONEY: { label: 'Orange Money', color: 'orange', icon: 'fas fa-mobile-alt', rowClass: 'bg-orange' },
  EXPRESS_UNION: { label: 'Express Union', color: 'dark', icon: 'fas fa-money-check-alt', rowClass: 'bg-navy' },
  VIREMENT: { label: 'Virement', color: 'info', icon: 'fas fa-university', rowClass: 'bg-teal' },
  CHEQUE: { label: 'Chèque', color: 'secondary', icon: 'fas fa-money-check', rowClass: 'bg-gray' },
};

function modeMeta(mode: string | null | undefined): ModePaiementMeta {
  return (mode && MODE_PAIEMENT_META[mode]) || { label: mode || 'Inconnu', color: 'secondary', icon: 'fas fa-question-circle', rowClass: '' };
}

// Ligne de la table "Détail des ventes" - une CaisseItem (ligne de vente)
// enrichie du nom de boutique, indispensable en vue consolidee.
interface HistoriqueVenteItem extends CaisseItem {
  boutiqueNom?: string;
}

@Component({
  selector: 'app-historique-vente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historique-vente.component.html',
  styleUrl: './historique-vente.component.css'
})
export class HistoriqueVenteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  boutiques: Boutique[] = [];
  boutiqueIds: number[] = [];
  toutesBoutiques = true;

  annees: Annee[] = [];
  annee: Annee | null = null;
  dates: Date[] = [];
  date: Date | null = null;

  ventes: Vente[] = [];
  ligneVente: HistoriqueVenteItem[] = [];
  filteredVentes: HistoriqueVenteItem[] = [];
  globalFilter = '';

  montantTotal = 0;
  montantNetEnCaisse = 0;
  remise = 0;
  totauxParMode: { [mode: string]: number } = {};
  montantBonEmisTotal = 0;

  loading = false;

  columns: TableColumn[] = [
    { field: 'boutique', header: 'Boutique', sortable: false },
    { field: 'numTicket', header: 'N° Ticket', sortable: true, filterable: true },
    { field: 'Ref', header: 'Référence', sortable: true, filterable: true },
    { field: 'libelle', header: 'Libellé', sortable: true, filterable: true },
    { field: 'quantite', header: 'Quantité', sortable: true, type: 'number' },
    { field: 'prixUnitaire', header: 'Prix Unitaire', sortable: true, type: 'number' },
    { field: 'modePaiement', header: 'Mode Paiement', sortable: true }
  ];

  constructor(
    private historiqueVenteService: HistoriqueVenteService,
    private boutiqueService: BoutiqueService
  ) {}

  ngOnInit(): void {
    this.boutiqueService.getBoutiques()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boutiques) => this.boutiques = boutiques,
        error: (error) => console.error('Erreur lors du chargement des boutiques', error)
      });

    this.chargerAnnees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Une boutique, plusieurs, ou toute la compagnie (liste vide).
  private boutiqueIdsPourRequete(): number[] {
    return this.toutesBoutiques ? [] : this.boutiqueIds;
  }

  onToutesBoutiquesChange(): void {
    if (this.toutesBoutiques) {
      this.boutiqueIds = [];
    }
    this.chargerAnnees();
  }

  onBoutiqueChange(): void {
    this.chargerAnnees();
  }

  peutGenerer(): boolean {
    return (this.toutesBoutiques || this.boutiqueIds.length > 0) && !!this.annee && !!this.date;
  }

  private chargerAnnees(): void {
    this.resetDateEtResultats();
    this.historiqueVenteService.getAnnees(this.boutiqueIdsPourRequete())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (annees) => this.annees = annees,
        error: (error) => console.error('Erreur lors du chargement des années', error)
      });
  }

  onAnneeChange(): void {
    this.resetDateEtResultats();
    if (!this.annee) {
      return;
    }
    this.historiqueVenteService.getDatesByAnnee(this.annee.id, this.boutiqueIdsPourRequete())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => this.dates = dates,
        error: (error) => console.error('Erreur lors du chargement des dates', error)
      });
  }

  private resetDateEtResultats(): void {
    this.date = null;
    this.dates = [];
    this.ventes = [];
    this.ligneVente = [];
    this.filteredVentes = [];
    this.montantTotal = 0;
    this.montantNetEnCaisse = 0;
    this.remise = 0;
    this.totauxParMode = {};
    this.montantBonEmisTotal = 0;
  }

  boutiqueNom(boutiqueid: number | undefined): string {
    const boutique = this.boutiques.find(b => b.id === boutiqueid);
    return boutique ? `${boutique.nom} (${boutique.code})` : '—';
  }

  genererHistorique(): void {
    if (!this.peutGenerer() || !this.annee || !this.date) {
      return;
    }
    this.loading = true;

    this.historiqueVenteService.getHistoriqueVenteByDate(this.annee.id, this.date, this.boutiqueIdsPourRequete())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventes) => {
          this.ventes = ventes;
          this.loading = false;
          this.calculerTotal();
        },
        error: (error) => {
          console.error('Erreur lors de la génération de l\'historique', error);
          this.loading = false;
        }
      });
  }

  // Meme logique que HistoriqueCaisseComponent.calculerTotal(), avec le nom
  // de boutique attache a chaque ligne pour la vue consolidee.
  calculerTotal(): void {
    this.ligneVente = [];
    this.montantTotal = 0;
    this.montantNetEnCaisse = 0;
    this.remise = 0;
    this.totauxParMode = {};
    this.montantBonEmisTotal = 0;

    this.ventes.forEach(v => {
      const boutiqueNom = this.boutiqueNom(v.boutiqueid);
      (v.items || []).forEach(item => {
        this.ligneVente.push({ ...item, boutiqueNom });
      });
      this.montantTotal += v.montantTotal;
      this.montantNetEnCaisse += v.montantNet;
      if (v.remise) this.remise += v.remise;

      if (v.paiements && v.paiements.length > 0) {
        v.paiements.forEach(p => {
          const mode = p.typePaiement || 'AUTRE';
          this.totauxParMode[mode] = (this.totauxParMode[mode] || 0) + (Number(p.montant) || 0);
        });
      } else if (v.typePaiement) {
        this.totauxParMode[v.typePaiement] = (this.totauxParMode[v.typePaiement] || 0) + (Number(v.montantNet) || 0);
      }

      if (v.montantBonEmis && v.montantBonEmis > 0) {
        this.montantBonEmisTotal += v.montantBonEmis;
        this.totauxParMode['ESPECES'] = (this.totauxParMode['ESPECES'] || 0) + v.montantBonEmis;
      }
    });

    this.filteredVentes = [...this.ligneVente];
  }

  onGlobalFilter(): void {
    const filterValue = (this.globalFilter || '').toLowerCase().trim();
    if (!filterValue) {
      this.filteredVentes = [...this.ligneVente];
      return;
    }
    this.filteredVentes = this.ligneVente.filter(lg =>
      (lg.numeroTicket || '').toLowerCase().includes(filterValue) ||
      (lg.article?.reference || '').toLowerCase().includes(filterValue) ||
      (lg.article?.libelle || '').toLowerCase().includes(filterValue) ||
      (lg.boutiqueNom || '').toLowerCase().includes(filterValue)
    );
  }

  getPaymentStats(): { mode: string; label: string; montant: number; color: string; icon: string }[] {
    return Object.keys(this.totauxParMode)
      .filter(mode => this.totauxParMode[mode] > 0)
      .map(mode => {
        const meta = modeMeta(mode);
        return { mode, label: meta.label, montant: this.totauxParMode[mode], color: meta.color, icon: meta.icon };
      })
      .sort((a, b) => b.montant - a.montant);
  }

  getModePaiementLabel(typePaiement: string | null | undefined): string {
    return modeMeta(typePaiement).label;
  }

  getPaymentColor(typePaiement: string | null | undefined): string {
    return modeMeta(typePaiement).color;
  }

  getRowClass(item: CaisseItem): string {
    return modeMeta(item.typePaiement).rowClass || 'bg-green';
  }

  formatNumber(value: number): string {
    return this.historiqueVenteService.formatNumber(value);
  }

  formatDate(date: Date): string {
    return this.historiqueVenteService.formatDate(date);
  }

  imprimerDetail(): void {
    if (this.ventes.length === 0) {
      return;
    }
    window.print();
  }

  hasData(): boolean {
    return this.ventes.length > 0;
  }
}
