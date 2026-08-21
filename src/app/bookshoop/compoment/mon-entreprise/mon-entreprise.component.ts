import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Compagnie } from '../../model/compagnie';
import { CompagnieService } from '../../service/compagnie.service';
import { Boutique } from '../../model/boutique';
import { PointVenteService } from '../../service/point-vente.service';

@Component({
  selector: 'app-mon-entreprise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mon-entreprise.component.html',
  styleUrls: ['./mon-entreprise.component.css']
})
export class MonEntrepriseComponent implements OnInit {
  compagnie: Compagnie | null = null;
  boutiques: Boutique[] = [];
  loading = false;
  saving = false;

  constructor(
    private compagnieService: CompagnieService,
    private pointVenteService: PointVenteService,
    private toastr: ToastrService
  ) {}

  // document.baseURI (et non window.location.origin) : ce dernier ne
  // contient que le protocole+domaine, pas le prefixe /esacom-pro/ sous
  // lequel l'appli est servie en production (<base href> de index.html) -
  // un lien construit sans ce prefixe renvoie un 404 nginx (deja constate).
  get lienBoutique(): string {
    return `${document.baseURI}shop/${this.compagnie?.code ?? ''}`;
  }

  lienPourBoutique(boutique: Boutique): string {
    return `${this.lienBoutique}/boutique/${boutique.id}`;
  }

  ngOnInit(): void {
    this.load();
    this.pointVenteService.getAllBoutiques().subscribe({
      next: (boutiques) => (this.boutiques = boutiques),
      error: () => {}
    });
  }

  load(): void {
    this.loading = true;
    this.compagnieService.getOwn().subscribe({
      next: (data) => {
        this.compagnie = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error("Impossible de charger les informations de l'entreprise.");
        console.error(error);
      }
    });
  }

  save(): void {
    if (!this.compagnie) { return; }
    this.saving = true;
    this.compagnieService.updateOwn(this.compagnie).subscribe({
      next: (data) => {
        this.compagnie = data;
        this.saving = false;
        this.toastr.success('Informations enregistrées.');
      },
      error: (error) => {
        this.saving = false;
        this.toastr.error(error?.error?.message || "Erreur lors de l'enregistrement.");
        console.error(error);
      }
    });
  }
}
