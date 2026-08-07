import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../model/client';
import { ClientService } from '../../service/client.service';
import { CompteClientService, VersementResponse } from '../../service/CompteClient.service';

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

  constructor(
    private clientService: ClientService,
    private compteClientService: CompteClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (clients) => this.clients = clients,
      error: (error) => console.error('Erreur lors du chargement des clients', error)
    });
  }

  charger(): void {
    if (!this.clientId) {
      return;
    }
    this.compteClientService.getVersementsClient(this.clientId).subscribe({
      next: (data) => this.versements = data,
      error: (error) => console.error('Erreur lors du chargement des versements', error)
    });
  }

  getTotalVerse(): number {
    return this.versements.reduce((sum, v) => sum + (v.montant || 0), 0);
  }
}
