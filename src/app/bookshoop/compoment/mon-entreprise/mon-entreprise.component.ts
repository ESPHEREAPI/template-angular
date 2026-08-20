import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Compagnie } from '../../model/compagnie';
import { CompagnieService } from '../../service/compagnie.service';

@Component({
  selector: 'app-mon-entreprise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mon-entreprise.component.html',
  styleUrls: ['./mon-entreprise.component.css']
})
export class MonEntrepriseComponent implements OnInit {
  compagnie: Compagnie | null = null;
  loading = false;
  saving = false;

  constructor(private compagnieService: CompagnieService, private toastr: ToastrService) {}

  get lienBoutique(): string {
    return `${window.location.origin}/shop/${this.compagnie?.code ?? ''}`;
  }

  ngOnInit(): void {
    this.load();
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
