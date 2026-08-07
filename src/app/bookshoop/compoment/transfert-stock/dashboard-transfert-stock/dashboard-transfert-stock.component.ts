import { Component, OnInit, OnDestroy } from '@angular/core';
import { Dashboard } from '../../../model/Dashboard';
import { StockService } from '../../../service/StockService';

// Import correct de Chart.js avec TOUS les contrôleurs nécessaires
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,      // ← AJOUT IMPORTANT
  BarController,       // ← AJOUT IMPORTANT
  Title,
  Tooltip,
  Legend,
  Filler              // ← AJOUT pour le fill
} from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Enregistrer TOUS les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,      // ← AJOUT IMPORTANT
  BarController,       // ← AJOUT IMPORTANT
  Title,
  Tooltip,
  Legend,
  Filler              // ← AJOUT pour le fill
);

@Component({
  selector: 'app-dashboard-transfert-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dashboard-transfert-stock.component.html',
  styleUrl: './dashboard-transfert-stock.component.css'
})
export class DashboardTransfertStockComponent implements OnInit, OnDestroy {
  dashboard: Dashboard | null = null;
  chargement: boolean = true;
  erreur: string = '';

  // Graphiques
  graphiqueValeurChart: ChartJS | null = null;
  graphiqueMouvementChart: ChartJS | null = null;

  constructor(private stockService: StockService) { }

  ngOnInit(): void {
    this.chargerDashboard();
  }

  /**
   * Charge le dashboard depuis le service
   */
  chargerDashboard(): void {
    this.chargement = true;
    this.erreur = '';

    this.stockService.obtenirDashboard().subscribe({
      next: (data: Dashboard) => {
        this.dashboard = data;
        this.chargement = false;

        // Afficher les graphiques après le rendu du DOM
        setTimeout(() => {
          this.initialiserGraphiques();
        }, 100);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement du dashboard', error);
        this.erreur = 'Erreur lors du chargement du dashboard';
        this.chargement = false;
      }
    });
  }

  /**
   * Initialise les graphiques Chart.js
   */
  initialiserGraphiques(): void {
    if (!this.dashboard) {
      console.warn('⚠️ Dashboard non disponible pour les graphiques');
      return;
    }

    console.log('📊 Initialisation des graphiques...');
    this.initialiserGraphiqueValeur();
    this.initialiserGraphiqueMouvement();
  }

  /**
   * Graphique de la valeur du stock (Magasins vs Points de vente)
   */
  initialiserGraphiqueValeur(): void {
    if (!this.dashboard) return;

    const ctx = document.getElementById('graphiqueValeur') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas graphiqueValeur non trouvé');
      return;
    }

    // Détruire le graphique existant
    if (this.graphiqueValeurChart) {
      this.graphiqueValeurChart.destroy();
    }

    const mois = this.dashboard.evolutionStock?.map(e => e.mois) || [];
    const valeurMagasins = this.dashboard.evolutionStock?.map(e => e.valeurMagasins) || [];
    const valeurPointsVente = this.dashboard.evolutionStock?.map(e => e.valeurPointsVente) || [];

    console.log('📈 Création graphique valeur avec', mois.length, 'points de données');

    this.graphiqueValeurChart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: mois,
        datasets: [
          {
            label: 'Magasins (Prix d\'achat)',
            data: valeurMagasins,
            borderColor: '#17a2b8',
            backgroundColor: 'rgba(23, 162, 184, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Points de vente (Prix de vente)',
            data: valeurPointsVente,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Évolution de la valeur du stock'
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XAF',
                    minimumFractionDigits: 0
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  minimumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      }
    });

    console.log('✅ Graphique valeur créé avec succès');
  }

  /**
   * Graphique des mouvements de stock
   */
  initialiserGraphiqueMouvement(): void {
    if (!this.dashboard) return;

    const ctx = document.getElementById('graphiqueMouvement') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas graphiqueMouvement non trouvé');
      return;
    }

    // Détruire le graphique existant
    if (this.graphiqueMouvementChart) {
      this.graphiqueMouvementChart.destroy();
    }

    const mois = this.dashboard.evolutionStock?.map(e => e.mois) || [];
    const entrees = this.dashboard.evolutionStock?.map(e => e.nombreEntrees) || [];
    const sorties = this.dashboard.evolutionStock?.map(e => e.nombreSorties) || [];

    console.log('📊 Création graphique mouvements avec', mois.length, 'points de données');

    this.graphiqueMouvementChart = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels: mois,
        datasets: [
          {
            label: 'Entrées',
            data: entrees,
            backgroundColor: '#28a745',
            borderColor: '#28a745',
            borderWidth: 1
          },
          {
            label: 'Sorties',
            data: sorties,
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Mouvements de stock'
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y;
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });

    console.log('✅ Graphique mouvements créé avec succès');
  }

  /**
   * Format un nombre en devise
   */
  formatDevise(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(montant);
  }

  /**
   * Détermine la classe Bootstrap pour la couleur d'alerte
   */
  obtenirClasseAlerte(couleur: string): string {
    switch (couleur) {
      case 'danger':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'success':
        return 'alert-success';
      default:
        return 'alert-info';
    }
  }

  /**
   * Détermine l'icône pour la couleur d'alerte
   */
  obtenirIconeAlerte(couleur: string): string {
    switch (couleur) {
      case 'danger':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  /**
   * Calcule le total des quantités pour les points de vente
   */
  getTotalQuantite(): number {
    return this.dashboard?.valeurPointsVente
      ?.reduce((acc, item) => acc + (item.quantiteTotal || 0), 0) || 0;
  }

  /**
   * Calcule le total des quantités pour les magasins
   */
  getTotalMagasins(): number {
    return this.dashboard?.valeurMagasins
      ?.reduce((acc, item) => acc + (item.quantiteTotal || 0), 0) || 0;
  }

  /**
   * Nettoyer les graphiques à la destruction du composant
   */
  ngOnDestroy(): void {
    console.log('🧹 Nettoyage des graphiques...');
    
    if (this.graphiqueValeurChart) {
      this.graphiqueValeurChart.destroy();
      this.graphiqueValeurChart = null;
    }
    
    if (this.graphiqueMouvementChart) {
      this.graphiqueMouvementChart.destroy();
      this.graphiqueMouvementChart = null;
    }
  }
}