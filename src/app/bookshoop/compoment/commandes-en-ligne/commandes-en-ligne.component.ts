import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { DevisService } from '../../service/devis.service';
import { AuthService } from '../../../auth/auth.service';
import { Devis } from '../../model/devis';

/**
 * Ecran admin "Commandes en ligne" - devis soumis par un client via le
 * site public e-commerce (CanalOrigine.EN_LIGNE), jamais les devis crees
 * en interne par le personnel (voir devis-list pour ceux-la, filtre
 * different et volontairement separe). Le filtre par origine est fait
 * cote serveur (CommandeEnLigneController), pas ici.
 *
 * "Valider et facturer" est une action one-click qui enchaine cote backend
 * accepter -> convertir en facture -> valider la facture (deduction de
 * stock) - une commande en ligne suit toujours cette meme sequence, pas
 * besoin des 3 ecrans separes utilises pour un devis interne negocie
 * manuellement.
 */
@Component({
  selector: 'app-commandes-en-ligne',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commandes-en-ligne.component.html',
  styleUrl: './commandes-en-ligne.component.css'
})
export class CommandesEnLigneComponent implements OnInit {

  commandes: Devis[] = [];
  statutFiltre = 'EN_ATTENTE';
  boutiqueid = 0;
  chargement = false;
  actionEnCoursId: number | null = null;

  readonly statuts = ['EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'CONVERTI', 'ANNULE'];

  constructor(
    private devisService: DevisService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.boutiqueid = this.authService.getBoutiqueByUserSession();
    this.chargerCommandes();
  }

  chargerCommandes(): void {
    this.chargement = true;
    this.devisService.findCommandesEnLigne(this.statutFiltre, this.boutiqueid)
      .pipe(finalize(() => this.chargement = false))
      .subscribe({
        next: (data) => this.commandes = data,
        error: (err) => this.toastr.error(this.devisService.getErrorMessage(err), 'Erreur de chargement')
      });
  }

  validerEtFacturer(commande: Devis): void {
    if (!confirm(`Valider et facturer la commande ${commande.numeroDevis} ? Le stock sera deduit immediatement.`)) {
      return;
    }
    this.actionEnCoursId = commande.id;
    this.devisService.validerEtFacturerCommandeEnLigne(commande.id)
      .pipe(finalize(() => this.actionEnCoursId = null))
      .subscribe({
        next: (facture) => {
          this.toastr.success(`Commande facturee : ${facture.numeroFacture}`, 'Commande validee');
          this.chargerCommandes();
        },
        error: (err) => this.toastr.error(this.devisService.getErrorMessage(err), 'Erreur de validation')
      });
  }

  refuser(commande: Devis): void {
    const motif = prompt('Motif du refus :');
    if (motif === null) { return; }
    this.actionEnCoursId = commande.id;
    this.devisService.refuserDevis(commande.id, motif || undefined)
      .pipe(finalize(() => this.actionEnCoursId = null))
      .subscribe({
        next: () => {
          this.toastr.warning('Commande refusee', 'Commande refusee');
          this.chargerCommandes();
        },
        error: (err) => this.toastr.error(this.devisService.getErrorMessage(err), 'Erreur')
      });
  }

  formaterMontant(montant?: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montant || 0);
  }

  getStatutBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      EN_ATTENTE: 'badge-warning',
      ACCEPTE: 'badge-info',
      REFUSE: 'badge-danger',
      CONVERTI: 'badge-success',
      ANNULE: 'badge-secondary'
    };
    return classes[statut] || 'badge-primary';
  }
}
