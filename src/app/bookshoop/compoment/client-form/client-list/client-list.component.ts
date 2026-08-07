import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ClientService } from '../../../service/client.service';
import { Client } from '../../../model/client';


@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbModalModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent implements OnInit, OnDestroy {
  // Données
  clientsList: Client[] = [];
  clientsFiltres: Client[] = [];
  Math = Math;
  
  // États
  chargement = false;
  filtres: FormGroup;
  rechercheRapideControl = new FormControl('');
  
  // Pagination
  pageCourante = 1;
  itemsParPage = 10;
  totalItems = 0;
  
  // Statistiques
  statistiques = {
    total: 0,
    actifs: 0,
    inactifs: 0,
    enAttente: 0,
    fideles: 0
  };
  
  // Gestion souscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private clientService: ClientService,
    private router: Router,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.filtres = this.fb.group({
      search: [''],
      statut: [''],
      fidelite: [false],
      ville: ['']
    });
  }

  ngOnInit(): void {
    this.chargerClients();
    this.configurerFiltres();
    this.configurerRechercheRapide();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configure la recherche rapide avec debounce
   */
  private configurerRechercheRapide(): void {
    this.rechercheRapideControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((valeur) => {
        // Synchroniser avec le champ de recherche principal
        this.filtres.patchValue({ search: valeur }, { emitEvent: true });
      });
  }

  /**
   * Configure tous les écouteurs de filtres avec debounce
   */
  private configurerFiltres(): void {
    // ✅ Recherche avec debounce (300ms) et distinctUntilChanged
    this.filtres.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((valeur) => {
        // Synchroniser avec la recherche rapide
        if (this.rechercheRapideControl.value !== valeur) {
          this.rechercheRapideControl.setValue(valeur, { emitEvent: false });
        }
        this.pageCourante = 1;
        this.appliquerFiltres();
      });

    // ✅ Filtre Statut (sans debounce - réaction immédiate)
    this.filtres.get('statut')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageCourante = 1;
        this.appliquerFiltres();
      });

    // ✅ Filtre Fidélité (sans debounce - réaction immédiate)
    this.filtres.get('fidelite')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageCourante = 1;
        this.appliquerFiltres();
      });

    // ✅ Filtre Ville (sans debounce - réaction immédiate)
    this.filtres.get('ville')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageCourante = 1;
        this.appliquerFiltres();
      });
  }

  chargerClients(): void {
    this.chargement = true;
    this.clientService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          this.clientsList = clients;
          this.totalItems = clients.length;
          this.calculerStatistiques();
          this.appliquerFiltres();
          this.chargement = false;
        },
        error: (error) => {
          this.handleError(error, 'Erreur lors du chargement');
          this.chargement = false;
        }
      });
  }

  calculerStatistiques(): void {
    this.statistiques = {
      total: this.clientsList.length,
      actifs: this.clientsList.filter(c => c.statut === 'ACTIF').length,
      inactifs: this.clientsList.filter(c => c.statut === 'INACTIF').length,
      enAttente: this.clientsList.filter(c => c.statut === 'EN_ATTENTE').length,
      fideles: this.clientsList.filter(c => c.fidelite).length
    };
  }

  /**
   * Applique tous les filtres en cascade
   */
  appliquerFiltres(): void {
    let resultat = [...this.clientsList];
    const formValues = this.filtres.value;

    // ✅ Filtre Recherche (champ search)
    const searchTerm = formValues.search?.trim().toLowerCase() ?? '';
    if (searchTerm) {
      resultat = resultat.filter(c =>
        (c.nom?.toLowerCase() ?? '').includes(searchTerm) ||
        (c.email?.toLowerCase() ?? '').includes(searchTerm) ||
        (c.telephone?.toLowerCase() ?? '').includes(searchTerm) ||
        (c.code?.toLowerCase() ?? '').includes(searchTerm) ||
        (c.ville?.toLowerCase() ?? '').includes(searchTerm)
      );
    }

    // ✅ Filtre Statut
    const statut = formValues.statut?.trim() ?? '';
    if (statut) {
      resultat = resultat.filter(c => c.statut === statut);
    }

    // ✅ Filtre Fidélité
    if (formValues.fidelite === true) {
      resultat = resultat.filter(c => c.fidelite === true);
    }

    // ✅ Filtre Ville
    const ville = formValues.ville?.trim() ?? '';
    if (ville) {
      resultat = resultat.filter(c => (c.ville?.trim() ?? '') === ville);
    }

    this.clientsFiltres = resultat;
    this.pageCourante = 1;
  }

  obtenirClientsPage(): Client[] {
    const debut = (this.pageCourante - 1) * this.itemsParPage;
    return this.clientsFiltres.slice(debut, debut + this.itemsParPage);
  }

  creerClient(): void {
    this.router.navigate(['/clients/nouveau']);
  }

  editerClient(id: number): void {
    this.router.navigate(['/clients', id, 'edit']);
  }

  voirDetails(id: number): void {
    this.router.navigate(['/clients', id]);
  }

  supprimerClient(client: Client): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${client.nom} ?`)) {
      this.chargement = true;
      if (!client.id) return;
      this.clientService.deleteClient(client.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Client supprimé avec succès');
            this.chargerClients();
          },
          error: (error) => {
            this.handleError(error, 'Erreur lors de la suppression');
            this.chargement = false;
          }
        });
    }
  }

  reinitialiserFiltres(): void {
    this.filtres.reset({
      search: '',
      statut: '',
      fidelite: false,
      ville: ''
    });
    this.rechercheRapideControl.setValue('', { emitEvent: false });
    this.pageCourante = 1;
    this.appliquerFiltres();
  }

  exporterCsv(): void {
    this.clientService.exportCsv(this.clientsFiltres);
    this.toastr.success('Fichier exporté avec succès');
  }

  obtenirBadgeStatut(statut: string): string {
    const badges: { [key: string]: string } = {
      'ACTIF': 'badge-success',
      'INACTIF': 'badge-secondary',
      'EN_ATTENTE': 'badge-warning'
    };
    return badges[statut] || 'badge-primary';
  }

  obtenirIconeStatut(statut: string): string {
    const icones: { [key: string]: string } = {
      'ACTIF': 'fa-check-circle',
      'INACTIF': 'fa-times-circle',
      'EN_ATTENTE': 'fa-clock'
    };
    return icones[statut] || 'fa-info-circle';
  }

  obtenirTotalPages(): number {
    return Math.ceil(this.clientsFiltres.length / this.itemsParPage);
  }

  private handleError(error: any, defaultMessage: string): void {
    const message = error?.error?.message || error?.message || defaultMessage;
    this.toastr.error(message);
  }
}