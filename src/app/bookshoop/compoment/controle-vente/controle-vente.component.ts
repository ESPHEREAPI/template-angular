import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';
import { ControleVenteService } from '../../service/ControleVente.service';
import { ControleVenteDTO, ControleVenteSummaryDTO } from '../../model/controle-vente';

@Component({
  selector: 'app-controle-vente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './controle-vente.component.html',
  styleUrls: ['./controle-vente.component.css']
})
export class ControleVenteComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  annee: number = new Date().getFullYear();
  mois: number = new Date().getMonth() + 1;

  controles: ControleVenteDTO[] = [];
  summary: ControleVenteSummaryDTO | null = null;
  loading = false;
  hasGenerated = false;

  constructor(
    private boutiqueService: BoutiqueService,
    private controleVenteService: ControleVenteService
  ) {}

  ngOnInit(): void {
    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
  }

  generer(): void {
    if (!this.boutiqueId) {
      return;
    }
    this.loading = true;
    this.hasGenerated = true;

    this.controleVenteService.generer(this.mois, this.annee, this.boutiqueId).subscribe({
      next: (data) => {
        this.controles = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la génération du contrôle des ventes', error);
        this.loading = false;
      }
    });

    this.controleVenteService.getSummary(this.mois, this.annee, this.boutiqueId).subscribe({
      next: (summary) => this.summary = summary,
      error: (error) => console.error('Erreur lors du chargement du résumé', error)
    });
  }
}
