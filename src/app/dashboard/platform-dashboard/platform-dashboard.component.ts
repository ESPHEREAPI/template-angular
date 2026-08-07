import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDashboardService } from '../../bookshoop/service/platform-dashboard.service';
import { CompagnieOverview } from '../../bookshoop/model/compagnie-overview';
import { VenteParCompagnie } from '../../bookshoop/model/vente-par-compagnie';

/**
 * Dashboard reserve aux comptes administrateur systeme (SUPER_ADMIN/
 * SYSTEM_ADMIN) : vue plateforme (toutes les compagnies, chiffres agreges).
 * Ces comptes n'ont pas acces aux donnees de gestion d'une compagnie
 * (ventes/stock/factures detaillees) - voir TenantScopeFilter cote backend.
 */
@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './platform-dashboard.component.html',
  styleUrl: './platform-dashboard.component.css'
})
export class PlatformDashboardComponent implements OnInit {
  compagnies: CompagnieOverview[] = [];
  ventes: VenteParCompagnie[] = [];
  chargement = true;
  erreur = false;

  // Periode du graphique de ventes - court terme (mois courant) par defaut,
  // ajustable pour une vue plus longue (comparer un mois passe, un trimestre...).
  debut: string = this.premierJourDuMois();
  fin: string = this.aujourdHui();

  constructor(private platformDashboardService: PlatformDashboardService) {}

  ngOnInit(): void {
    this.chargerCompagnies();
    this.chargerVentes();
  }

  private premierJourDuMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
  }

  private aujourdHui(): string {
    return new Date().toISOString().substring(0, 10);
  }

  chargerCompagnies(): void {
    this.platformDashboardService.getCompagniesOverview().subscribe({
      next: (compagnies) => {
        this.compagnies = compagnies;
        this.chargement = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des compagnies:', error);
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  chargerVentes(): void {
    this.platformDashboardService.getVentesParCompagnie(this.debut, this.fin).subscribe({
      next: (ventes) => this.ventes = ventes,
      error: (error) => console.error('Erreur lors du chargement des ventes par compagnie:', error)
    });
  }

  get totalCompagnies(): number {
    return this.compagnies.length;
  }

  get compagniesActives(): number {
    return this.compagnies.filter(c => c.actif).length;
  }

  get compagniesInactives(): number {
    return this.totalCompagnies - this.compagniesActives;
  }

  get totalUtilisateurs(): number {
    return this.compagnies.reduce((total, c) => total + (c.nombreUtilisateurs || 0), 0);
  }

  get licencesAExpirerBientot(): CompagnieOverview[] {
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);
    return this.compagnies.filter(c =>
      c.dateExpirationLicence && new Date(c.dateExpirationLicence) <= dans30Jours
    );
  }

  get totalVentesPeriode(): number {
    return this.ventes.reduce((total, v) => total + (v.totalVentes || 0), 0);
  }

  get venteMax(): number {
    return Math.max(1, ...this.ventes.map(v => v.totalVentes || 0));
  }

  largeurBarre(vente: VenteParCompagnie): number {
    return Math.round((vente.totalVentes / this.venteMax) * 100);
  }

  statutLicenceClasse(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'badge-success';
      case 'GENEREE': return 'badge-info';
      case 'SUSPENDUE': return 'badge-warning';
      case 'EXPIREE': return 'badge-danger';
      case 'REVOQUEE': return 'badge-secondary';
      default: return 'badge-light';
    }
  }
}
