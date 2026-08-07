import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ModePaiementLibelle } from '../../../enums/ModePaiement';
import { StatutVersement, StatutVersementColor, StatutVersementLibelle } from '../../../enums/StatutVersement';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { VersementResponse } from '../../../model/VersementResponse';
import { VersementService } from '../../../service/VersementService';
import { FactureService } from '../../../service/facture.service';
import { Client } from '../../../model/client';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Facture } from '../../../model/facture';
import { ClientService } from '../../../service/client.service';
import { ToastrService } from 'ngx-toastr';

interface RapportData {
  client: Client;
  periodeDebut: Date;
  periodeFin: Date;
  

  totalValides: number;
  totalEnAttente: number;
  totalAnnules: number;
  versements: VersementResponse[];
  totalVersements: number;
  nombreVersements: number;
  montantFactures: number;
  soldeRestant: number;
  montantMoyenVersement: number;
  factures: any;
  soldeTotal: number;
}
@Component({
  selector: 'app-rapport-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './rapport-client.component.html',
  styleUrl: './rapport-client.component.css'
})
export class RapportClientComponent implements OnInit, OnDestroy {
  
  filterForm!: FormGroup;
  clients: Client[] = [];
  rapportData?: RapportData;
  clientsLoading!: boolean;
  Date=Date;
  loading = false;
  generatingPDF = false;
  showRapport = false;
  
  // Enums pour le template
  modePaiementLibelle = ModePaiementLibelle;
  statutLibelle = StatutVersementLibelle;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private versementService: VersementService,
    private factureService: FactureService,
    private clientservice:ClientService,
     private toastr: ToastrService,
        private cdr: ChangeDetectorRef

  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire de filtres
   */
  initForm(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      clientId: ['', Validators.required],
      dateDebut: [firstDayOfMonth.toISOString().split('T')[0], Validators.required],
      dateFin: [today.toISOString().split('T')[0], Validators.required]
    });
  }

  /**
   * Charge la liste des clients
   */
loadClients(): void {
    this.clientsLoading = true;
    // Simuler le chargement des clients
    // TODO: Remplacer par un vrai service client
    setTimeout(() => {
     // TODO: Implémenter le service ClientService
         // Pour l'instant, données de test
         // Charger clients et produits en parallèle
             forkJoin({
               clients: this.versementService.getClient(),
              
             }).pipe(takeUntil(this.destroy$))
               .subscribe({
                 next: (data) => {
                   this.clients = data.clients;
                 
         
                   console.log('✓ Clients chargés:', this.clients.length);
                 
         
            
                 },
                 error: (err) => {
                   console.error('❌ Erreur chargement données:', err);
                   this.toastr.error('Erreur lors du chargement des données');
                 
                   this.cdr.markForCheck();
                 }
               });
         //this.clients = this.clients;
      this.clientsLoading = false;
    }, 500);
  }


  /**
   * Génère le rapport
   */
  genererRapport(): void {
    if (this.filterForm.invalid) {
      Object.keys(this.filterForm.controls).forEach(key => {
        this.filterForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.filterForm.value;
    const clientId = formValue.clientId;
    const dateDebut = new Date(formValue.dateDebut);
    const dateFin = new Date(formValue.dateFin);

    // Validation des dates
    if (dateDebut > dateFin) {
      alert('La date de début doit être antérieure à la date de fin');
      return;
    }

    this.loading = true;
    this.showRapport = false;

    // Récupération des versements du client pour la période
    this.versementService.getVersementsClient(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (versements) => {
          // Filtrer par période
          const versementsFiltres = versements.filter(v => {
            const dateVersement = new Date(v.dateVersement);
            return dateVersement >= dateDebut && dateVersement <= dateFin;
          });

          // Calculer les totaux
          const totalVersements = versementsFiltres.reduce((sum, v) => sum + v.montant, 0);
          const nombreVersements = versementsFiltres.length;

          // Récupérer les factures du client
          this.factureService.getFacturesClient(clientId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (factures) => {
                const montantFactures = factures.reduce((sum, f) => sum + f.totalTtc, 0);
                const soldeRestant = factures.reduce((sum, f) => sum + f.soldeRestant, 0);

                // Construire les données du rapport
                this.rapportData = {
                  client: this.getSelectedClient()!,
                  periodeDebut: dateDebut,
                  periodeFin: dateFin,
                  versements: versementsFiltres,
                  totalVersements,
                  nombreVersements,
                  montantFactures,
                  soldeRestant,
                  factures,
                  montantMoyenVersement:0,
                  soldeTotal:0,
                  totalAnnules:0,
                  totalEnAttente:soldeRestant,
                  totalValides:0,
                 

               

                 


                };

                this.showRapport = true;
                this.loading = false;
              },
              error: () => {
                this.loading = false;
              }
            });
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Réinitialise le rapport
   */
  resetRapport(): void {
    this.showRapport = false;
    this.rapportData = undefined;
    this.filterForm.reset();
    this.initForm();
  }

  /**
   * Imprime le rapport
   */
  printRapport(): void {
    window.print();
  }

  /**
   * Exporte en PDF
   */
  exportPDF(): void {
    if (!this.rapportData) return;

    this.generatingPDF = true;

    // Préparer les données pour le PDF
    const pdfData = {
      clientId: this.rapportData.client.id,
      dateDebut: this.rapportData.periodeDebut,
      dateFin: this.rapportData.periodeFin
    };

    this.versementService.genererRapportClientPDF(
      pdfData.clientId ?? 0,
      pdfData.dateDebut,
      pdfData.dateFin
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-versements-${this.rapportData!.client.code}-${this.formatDateForFilename(pdfData.dateDebut)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.generatingPDF = false;
      },
      error: () => {
        this.generatingPDF = false;
      }
    });
  }

  /**
   * Récupère le client sélectionné
   */
  getSelectedClient(): Client | undefined {
    const clientId = this.filterForm.get('clientId')?.value;
    return this.clients.find(c => c.id === +clientId);
  }

  /**
   * Formate un montant
   */
  formatMontant(montant?: number): string {
    if (montant === undefined) return '0 XAF';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' XAF';
  }

  /**
   * Formate une date pour le nom de fichier
   */
  formatDateForFilename(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Calcule le pourcentage payé
   */
  getPourcentagePaye(): number {
    if (!this.rapportData || this.rapportData.montantFactures === 0) {
      return 0;
    }
    const montantPaye = this.rapportData.montantFactures - this.rapportData.soldeRestant;
    return (montantPaye / this.rapportData.montantFactures) * 100;
  }

  /**
   * Retourne la classe de la progress bar
   */
  getProgressBarClass(): string {
    const pourcentage = this.getPourcentagePaye();
    if (pourcentage >= 100) return 'bg-success';
    if (pourcentage >= 75) return 'bg-info';
    if (pourcentage >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  /**
   * Retourne le libellé du mode de paiement
   */
  getModePaiementLibelle(mode: string): string {
    return this.modePaiementLibelle[mode as keyof typeof ModePaiementLibelle] || mode;
  }

  /**
   * Retourne la classe du badge de statut
   */
  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE':
        return 'badge-success';
      case 'EN_ATTENTE':
        return 'badge-warning';
      case 'ANNULE':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
   getStatutLibelle(statut: StatutVersement): string {
    
    return this.statutLibelle[statut];
  }

  /**
   * Calcule le montant moyen des versements
   */
  getMontantMoyen(): number {
    if (!this.rapportData || this.rapportData.nombreVersements === 0) {
      return 0;
    }
    return this.rapportData.totalVersements / this.rapportData.nombreVersements;
  }

  /**
   * Retourne les versements groupés par mois
   */
  getVersementsParMois(): { mois: string; montant: number; nombre: number }[] {
    if (!this.rapportData) return [];

    const groupes = new Map<string, { montant: number; nombre: number }>();

    this.rapportData.versements.forEach(v => {
      const date = new Date(v.dateVersement);
      const moisAnnee = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groupes.has(moisAnnee)) {
        groupes.set(moisAnnee, { montant: 0, nombre: 0 });
      }
      
      const groupe = groupes.get(moisAnnee)!;
      groupe.montant += v.montant;
      groupe.nombre += 1;
    });

    return Array.from(groupes.entries())
      .map(([mois, data]) => ({
        mois: this.formatMoisAnnee(mois),
        montant: data.montant,
        nombre: data.nombre
      }))
      .sort((a, b) => a.mois.localeCompare(b.mois));
  }

  /**
   * Formate un mois-année
   */
  formatMoisAnnee(moisAnnee: string): string {
    const [annee, mois] = moisAnnee.split('-');
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${moisNoms[parseInt(mois) - 1]} ${annee}`;
  }

  /**
   * Retourne les versements groupés par mode de paiement
   */
  getVersementsParMode(): { mode: string; montant: number; nombre: number; pourcentage: number }[] {
    if (!this.rapportData) return [];

    const groupes = new Map<string, { montant: number; nombre: number }>();

    this.rapportData.versements.forEach(v => {
      const mode = v.modePaiement;
      
      if (!groupes.has(mode)) {
        groupes.set(mode, { montant: 0, nombre: 0 });
      }
      
      const groupe = groupes.get(mode)!;
      groupe.montant += v.montant;
      groupe.nombre += 1;
    });

    return Array.from(groupes.entries())
      .map(([mode, data]) => ({
        mode: this.getModePaiementLibelle(mode),
        montant: data.montant,
        nombre: data.nombre,
        pourcentage: (data.montant / this.rapportData!.totalVersements) * 100
      }))
      .sort((a, b) => b.montant - a.montant);
  }
}
