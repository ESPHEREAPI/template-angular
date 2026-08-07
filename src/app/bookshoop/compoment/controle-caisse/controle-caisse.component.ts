import { Component, OnInit } from '@angular/core';
import { Vente } from '../../model/vente';
import { ControleCaisseService } from '../../service/controle-caisse.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Page } from '../../model/page';
import { CommonModule } from '@angular/common';
import { User } from '../../model/user';
import { UserService } from '../../service/user-service.service';

@Component({
  selector: 'app-controle-caisse',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule
  ],
  templateUrl: './controle-caisse.component.html',
  styleUrl: './controle-caisse.component.css'
})
export class ControleCaisseComponent implements OnInit {
  ventes: Vente[] = [];
  venteSelectionnee?: Vente;
  totalRecords = 0;
  pageSize = 5;
  currentPage = 0;
  totalPages = 0;
  filtreForm: FormGroup;
  statutOptions = ['EN_COURS', 'TERMINEE', 'ANNULEE'];
  caissiers: User[] = [];
  searchTerm = '';
  ventesFiltrees: Vente[] = [];
  resultat_statut: boolean = false;
  username!: string;

  constructor(
    private venteService: ControleCaisseService, 
    private fb: FormBuilder, 
    private userService: UserService
  ) {
    this.filtreForm = this.fb.group({
      statut: [''],
      vendeur: [''],
      dateDebut: [''],  // ✅ String vide pour datetime-local
      dateFin: ['']     // ✅ String vide pour datetime-local
    });
  }

  ngOnInit(): void {
    this.loadVentes();
    this.chargeCaissiers();
    const user = this.userService.getUserConnected();
    console.log(user);
    if (user) {
      this.username = user.username;
      console.log(this.username);
    }
  }

  loadVentes(page: number = 0): void {
    let { statut, dateDebut, dateFin } = this.filtreForm.value;
    
    // ✅ Convertir les strings datetime-local en objets Date
    let dateDebutObj: Date | undefined = undefined;
    let dateFinObj: Date | undefined = undefined;
    
    if (dateDebut && dateDebut.trim() !== '') {
      dateDebutObj = new Date(dateDebut);
    }
    
    if (dateFin && dateFin.trim() !== '') {
      dateFinObj = new Date(dateFin);
    }

    // ✅ Ne passer que les valeurs définies au service
    this.venteService.getVentes(
      page, 
      this.pageSize, 
      statut || undefined,
      dateDebutObj,
      dateFinObj
    ).subscribe({
      next: (data: Page<Vente>) => {
        this.ventes = data.content;
        this.ventesFiltrees = data.content;
        console.log("data", this.ventes);
        this.totalRecords = data.totalElements;
        this.currentPage = data.number;
        this.totalPages = data.totalPages;
        this.venteSelectionnee = undefined;
      },
      error: (err) => {
        console.error('Erreur chargement ventes:', err);
        if (err.error?.message) {
          console.error('Message backend:', err.error.message);
        }
        this.totalRecords = 0;
        this.currentPage = 0;
        this.totalPages = 0;
      }
    });
  }

  getMontantTotal() {
    return this.ventesFiltrees.reduce((sum, vente) => sum + vente.montantTotal, 0);
  }

  getRemiseTotal() {
    return this.ventesFiltrees.reduce((sum, vente) => sum + (vente.remise ?? 0), 0);
  }

  chargeCaissiers() {
    this.venteService.getAllCaissier().subscribe({
      next: (data: User[]) => {
        this.caissiers = data;
      },
      error: (err) => console.error('Erreur chargement Caissier(e)', err)
    });
  }

  onPageChange(page: number) {
    this.loadVentes(page);
  }

  appliquerFiltres() {
    this.loadVentes(0);
  }

  resetFiltres() {
    this.filtreForm.reset({ 
      statut: '', 
      dateDebut: '',  // ✅ String vide pour datetime-local
      dateFin: ''     // ✅ String vide pour datetime-local
    });
    this.loadVentes(0);
  }

  // ✅ Méthode pour obtenir la date max (aujourd'hui)
  getMaxDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  selectionnerVente(vente: Vente) {
    this.venteSelectionnee = vente;
  }

  modifierStatut(vente: Vente, event: Event) {
    const nouveauStatut = (event.target as HTMLSelectElement).value;
    console.log("ancien statut", vente.statut);
    console.log("nouveau statut", nouveauStatut);
    if (!vente.id) return;
    console.log("vente modifiee", vente.items);
    console.log("username", this.username);
    
    this.venteService.updateStatut(vente.id, this.username, nouveauStatut).subscribe({
      next: (updated) => {
        vente.statut = updated.statut;
        alert('Statut modifié avec succès.');
      },
      error: (err) => {
        console.error("Erreur complète :", err);
        let msg = "Erreur lors de la modification du statut.";
        if (err.error && err.error.message) {
          msg = `${msg}\n\nMessage: ${err.error.message}\nStatus: ${err.status}`;
        }
        alert(msg);
      }
    });
  }

  trackByVenteId(index: number, vente: Vente): any {
    return vente.id;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'TERMINEE':
        this.resultat_statut = false;
        return 'text-success';
      case 'ANNULEE':
        this.resultat_statut = true;
        return 'text-danger';
      case 'EN_COURS':
        this.resultat_statut = false;
        return 'text-warning';
      default:
        this.resultat_statut = false;
        return 'text-secondary';
    }
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'Terminer':
        return 'badge-success';
      case 'Annuler':
        return 'badge-danger';
      case 'En attente':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  get Math() {
    return Math;
  }

  onSearch(term: string) {
    const search = term.toLowerCase();
    this.ventesFiltrees = this.ventes.filter(v =>
      v.numeroTicket?.toLowerCase().includes(search) ||
      v.userinsert?.toLowerCase().includes(search)
    );
  }
}