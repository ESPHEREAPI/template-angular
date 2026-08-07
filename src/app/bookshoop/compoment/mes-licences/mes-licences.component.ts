import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Licence } from '../../model/licence';
import { LicenceMine } from '../../model/licence-mine';
import { LicenceService } from '../../service/licence.service';

@Component({
  selector: 'app-mes-licences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mes-licences.component.html',
  styleUrls: ['./mes-licences.component.css']
})
export class MesLicencesComponent implements OnInit {
  mine: LicenceMine | null = null;
  historique: Licence[] = [];
  loading = false;
  cleAActiver = '';
  activation = false;
  demarrageEssai = false;

  constructor(private licenceService: LicenceService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.load();
    this.loadHistorique();
  }

  load(): void {
    this.loading = true;
    this.licenceService.getMine().subscribe({
      next: (data) => {
        this.mine = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error("Impossible de charger l'état de votre licence.");
        console.error(error);
      }
    });
  }

  loadHistorique(): void {
    this.licenceService.getHistorique().subscribe({
      next: (data) => (this.historique = data),
      error: (error) => console.error(error)
    });
  }

  joursRestants(licence: Licence): number | null {
    if (!licence.dateExpiration) { return null; }
    const diff = new Date(licence.dateExpiration).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  activer(): void {
    if (!this.cleAActiver.trim()) {
      this.toastr.warning('Collez la clé de licence reçue.');
      return;
    }
    this.activation = true;
    this.licenceService.activerParCle(this.cleAActiver.trim()).subscribe({
      next: () => {
        this.activation = false;
        this.cleAActiver = '';
        this.toastr.success('Licence activée avec succès.');
        this.load();
        this.loadHistorique();
      },
      error: (error) => {
        this.activation = false;
        this.toastr.error(error?.error?.message || "Erreur lors de l'activation de la licence.");
      }
    });
  }

  demarrerEssai(): void {
    this.demarrageEssai = true;
    this.licenceService.demarrerEssai().subscribe({
      next: () => {
        this.demarrageEssai = false;
        this.toastr.success('Essai gratuit démarré.');
        this.load();
        this.loadHistorique();
      },
      error: (error) => {
        this.demarrageEssai = false;
        this.toastr.error(error?.error?.message || "Erreur lors du démarrage de l'essai.");
      }
    });
  }
}
