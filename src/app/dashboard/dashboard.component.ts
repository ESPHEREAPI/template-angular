import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLteService } from '../services/admin-lte-service';
import { ContentHeaderComponent } from '../content-header/content-header.component';
import { AuthService } from '../auth/auth.service';
import { PlatformDashboardComponent } from './platform-dashboard/platform-dashboard.component';
import { CompagnieDashboardService } from '../bookshoop/service/CompagnieDashboard.service';
import { CompagnieDashboard } from '../bookshoop/model/compagnie-dashboard';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ROLES_SYSTEME = ['SUPER_ADMIN', 'SYSTEM_ADMIN'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ContentHeaderComponent, PlatformDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Dashboard';
  breadcrumbItems = [
    { label: 'Home', route: '/dashboard' },
  { label: 'Dashboard', active: true }
  ];
  estCompteSysteme = false;

  dashboard: CompagnieDashboard | null = null;
  chargement = true;
  erreur = '';

  private evolutionChart: ChartJS | null = null;
  private repartitionChart: ChartJS | null = null;

  constructor(
    private adminLteService: AdminLteService,
    private authService: AuthService,
    private compagnieDashboardService: CompagnieDashboardService
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUserValue?.usersDTO?.role?.name;
    this.estCompteSysteme = ROLES_SYSTEME.includes(role ?? '');

    setTimeout(() => {
      this.adminLteService.iniAdminLTE
    }, 100)

    if (!this.estCompteSysteme) {
      this.chargerDashboard();
    }
  }

  chargerDashboard(): void {
    this.chargement = true;
    this.erreur = '';

    this.compagnieDashboardService.obtenirDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.chargement = false;
        setTimeout(() => this.initialiserGraphiques(), 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard', error);
        this.erreur = 'Erreur lors du chargement du dashboard';
        this.chargement = false;
      }
    });
  }

  formatDevise(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(montant ?? 0);
  }

  private initialiserGraphiques(): void {
    if (!this.dashboard) return;
    this.initialiserGraphiqueEvolution();
    this.initialiserGraphiqueRepartition();
  }

  private initialiserGraphiqueEvolution(): void {
    if (!this.dashboard) return;
    const ctx = document.getElementById('evolutionVentesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.evolutionChart) {
      this.evolutionChart.destroy();
    }

    const labels = this.dashboard.evolutionVentes.map(e => e.mois);
    const totaux = this.dashboard.evolutionVentes.map(e => e.total);

    this.evolutionChart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Chiffre d\'affaires',
          data: totaux,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: 'Évolution des ventes (6 derniers mois)' },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => this.formatDevise(context.parsed.y)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value: any) => this.formatDevise(value) }
          }
        }
      }
    });
  }

  private initialiserGraphiqueRepartition(): void {
    if (!this.dashboard) return;
    const ctx = document.getElementById('repartitionBoutiquesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.repartitionChart) {
      this.repartitionChart.destroy();
    }

    const labels = this.dashboard.ventesParBoutique.map(v => v.boutiqueNom);
    const totaux = this.dashboard.ventesParBoutique.map(v => v.total);

    this.repartitionChart = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ventes du mois',
          data: totaux,
          backgroundColor: '#17a2b8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: 'Ventes du mois par boutique' },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => this.formatDevise(context.parsed.y)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value: any) => this.formatDevise(value) }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.evolutionChart?.destroy();
    this.repartitionChart?.destroy();
  }
}
