import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModePaiement } from '../../model/mode-paiement';
import { ModePaiementService } from '../../service/ModePaiement.service';

@Component({
  selector: 'app-mode-paiement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-paiement.component.html',
  styleUrls: ['./mode-paiement.component.css']
})
export class ModePaiementComponent implements OnInit {
  modes: ModePaiement[] = [];

  constructor(private modePaiementService: ModePaiementService) {}

  ngOnInit(): void {
    this.modePaiementService.getAll().subscribe({
      next: (modes) => this.modes = modes,
      error: (error) => console.error('Erreur lors du chargement des modes de paiement', error)
    });
  }
}
