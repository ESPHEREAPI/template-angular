import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CompagnieParametres } from '../../model/compagnie-parametres';
import { CompagnieParametresService } from '../../service/compagnie-parametres.service';

export const FORMATS_LOGIN: { value: CompagnieParametres['loginFormat']; libelle: string; exemple: string }[] = [
  { value: 'INITIALE_NOM', libelle: 'Initiale du prénom + nom', exemple: 'jdupont' },
  { value: 'PRENOM_POINT_NOM', libelle: 'Prénom.Nom', exemple: 'jean.dupont' },
  { value: 'NOM_INITIALE_PRENOM', libelle: 'Nom + initiale du prénom', exemple: 'dupontj' },
  { value: 'CODE_TYPE_SEQUENCE', libelle: 'Code du type de commerce + séquence', exemple: 'LIB-0001, QUI-0002, MINI-0003...' }
];

@Component({
  selector: 'app-option-entreprise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './option-entreprise.component.html',
  styleUrls: ['./option-entreprise.component.css']
})
export class OptionEntrepriseComponent implements OnInit {
  parametres: CompagnieParametres | null = null;
  loading = false;
  saving = false;
  ongletActif: 'securite' | 'fiscalite' | 'ticket' | 'facture' | 'bonAchat' = 'securite';
  formatsLogin = FORMATS_LOGIN;

  constructor(private compagnieParametresService: CompagnieParametresService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.compagnieParametresService.getOwn().subscribe({
      next: (data) => {
        this.parametres = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error("Impossible de charger le paramétrage de l'entreprise.");
        console.error(error);
      }
    });
  }

  exempleFormatActif(): string {
    const format = this.formatsLogin.find(f => f.value === this.parametres?.loginFormat);
    return format ? format.exemple : '';
  }

  save(): void {
    if (!this.parametres) { return; }
    this.saving = true;
    this.compagnieParametresService.updateOwn(this.parametres).subscribe({
      next: (data) => {
        this.parametres = data;
        this.saving = false;
        this.toastr.success('Paramètres enregistrés.');
      },
      error: (error) => {
        this.saving = false;
        this.toastr.error(error?.error?.message || "Erreur lors de l'enregistrement.");
        console.error(error);
      }
    });
  }
}
