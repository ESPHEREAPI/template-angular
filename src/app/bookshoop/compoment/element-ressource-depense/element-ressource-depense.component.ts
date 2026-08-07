import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Boutique } from '../../model/boutique';
import { BoutiqueService } from '../../service/boutique.service';
import { RessourceService } from '../../service/Ressource.service';
import { ChargeService } from '../../service/Charge.service';

interface JournalEntry {
  date: string;
  libelle: string;
  type: 'Ressource' | 'Charge';
  montant: number;
}

@Component({
  selector: 'app-element-ressource-depense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './element-ressource-depense.component.html',
  styleUrls: ['./element-ressource-depense.component.css']
})
export class ElementRessourceDepenseComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiqueId: number | null = null;
  debut: string = this.premierJourMois();
  fin: string = this.dernierJourMois();

  entries: JournalEntry[] = [];

  constructor(
    private boutiqueService: BoutiqueService,
    private ressourceService: RessourceService,
    private chargeService: ChargeService
  ) {}

  ngOnInit(): void {
    this.boutiqueService.getBoutiques().subscribe({
      next: (boutiques) => this.boutiques = boutiques,
      error: (error) => console.error('Erreur lors du chargement des boutiques', error)
    });
  }

  premierJourMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
  }

  dernierJourMois(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10);
  }

  charger(): void {
    if (!this.boutiqueId) {
      return;
    }
    forkJoin({
      ressources: this.ressourceService.getByBoutiqueAndPeriode(this.boutiqueId, this.debut, this.fin),
      charges: this.chargeService.getByBoutiqueAndPeriode(this.boutiqueId, this.debut, this.fin)
    }).subscribe({
      next: ({ ressources, charges }) => {
        const entriesRessource: JournalEntry[] = ressources.map(r => ({
          date: r.dateRessource,
          libelle: r.typeResource?.libelle || '-',
          type: 'Ressource',
          montant: r.montant
        }));
        const entriesCharge: JournalEntry[] = charges.map(c => ({
          date: c.dateCharge,
          libelle: c.typeDepense?.libelle || '-',
          type: 'Charge',
          montant: -c.montant
        }));
        this.entries = [...entriesRessource, ...entriesCharge]
          .sort((a, b) => a.date.localeCompare(b.date));
      },
      error: (error) => console.error('Erreur lors du chargement du journal', error)
    });
  }

  getSolde(): number {
    return this.entries.reduce((sum, e) => sum + e.montant, 0);
  }
}
