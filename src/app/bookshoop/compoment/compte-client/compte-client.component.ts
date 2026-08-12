import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../model/client';
import { ClientService } from '../../service/client.service';
import { CompteClientService, VersementResponse } from '../../service/CompteClient.service';
import { ClientSolde } from '../../model/client-solde';

@Component({
  selector: 'app-compte-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compte-client.component.html',
  styleUrls: ['./compte-client.component.css']
})
export class CompteClientComponent implements OnInit {
  clients: Client[] = [];
  clientId: number | null = null;

  versements: VersementResponse[] = [];
  solde: ClientSolde | null = null;

  // Vue globale compagnie : combien elle attend au total, et le classement
  // des clients par reste-a-payer decroissant ("clients a haute redevance").
  totalAttendu = 0;
  soldesClients: ClientSolde[] = [];
  loadingGlobal = false;

  constructor(
    private clientService: ClientService,
    private compteClientService: CompteClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (clients) => this.clients = clients,
      error: (error) => console.error('Erreur lors du chargement des clients', error)
    });
    this.chargerVueGlobale();
  }

  chargerVueGlobale(): void {
    this.loadingGlobal = true;
    this.compteClientService.getSoldesClients().subscribe({
      next: (soldes) => {
        this.soldesClients = soldes;
        this.totalAttendu = soldes.reduce((sum, s) => sum + (s.soldeRestant || 0), 0);
        this.loadingGlobal = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des soldes clients', error);
        this.loadingGlobal = false;
      }
    });
  }

  // Selectionner un client depuis le classement "haute redevance" -
  // charge directement son releve, sans repasser par le select.
  selectionnerClient(clientId: number): void {
    this.clientId = clientId;
    this.charger();
  }

  charger(): void {
    if (!this.clientId) {
      return;
    }
    this.compteClientService.getVersementsClient(this.clientId).subscribe({
      next: (data) => this.versements = data,
      error: (error) => console.error('Erreur lors du chargement des versements', error)
    });
    this.compteClientService.getSoldeClient(this.clientId).subscribe({
      next: (data) => this.solde = data,
      error: () => {
        // 204/erreur = pas de facture pour ce client, donc rien a devoir.
        this.solde = null;
      }
    });
  }

  getTotalVerse(): number {
    return this.versements.reduce((sum, v) => sum + (v.montant || 0), 0);
  }

  clientNom(clientId: number): string {
    return this.clients.find(c => c.id === clientId)?.nom || '';
  }

  imprimerReleve(): void {
    if (!this.clientId) {
      return;
    }
    window.print();
  }
}
