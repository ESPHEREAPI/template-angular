import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { Annee } from '../../model/annee';
import { Mois } from '../../model/mois';
import { Person } from '../../model/person';
import { CaisseFilter } from '../../model/caisse-filter';
import { HistoriqueCaisse } from '../../model/historique-caisse';
import { Vente } from '../../model/vente';
import { HistoriqueCaisseService } from '../../service/historique-caisse.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableColumn } from '../../model/table-column';
import { UserService } from '../../service/user-service.service';
import { CaisseItem } from '../../model/caisse-item';
import { User } from '../../model/user';
import { AuthService } from '../../../auth/auth.service';
import { UserSession } from '../../../model/user-session';
import { ToastrModule, ToastrService } from 'ngx-toastr';

// Metadonnees d'affichage par mode de paiement - les valeurs DOIVENT
// correspondre exactement a l'enum backend TypePaiement (voir
// com.mproduits.enums.TypePaiement), pas a l'ancien enum PaymentType du
// frontend qui utilisait 'CARTE' au lieu de 'CARTE_BANCAIRE' et faisait
// silencieusement echouer tout rapprochement carte/mixte.
interface ModePaiementMeta {
  label: string;
  color: string;
  icon: string;
  rowClass: string;
}

const MODE_PAIEMENT_META: { [mode: string]: ModePaiementMeta } = {
  ESPECES: { label: 'Espèces', color: 'success', icon: 'fas fa-money-bill-wave', rowClass: 'bg-green' },
  CARTE_BANCAIRE: { label: 'Carte Bancaire', color: 'info', icon: 'fas fa-credit-card', rowClass: 'table-info' },
  BON_ACHAT: { label: "Bon d'Achat", color: 'secondary', icon: 'fas fa-ticket-alt', rowClass: 'bg-purple' },
  MOBILE_MONEY: { label: 'MTN Money', color: 'primary', icon: 'fas fa-mobile-alt', rowClass: 'bg-yellow' },
  ORANGE_MONEY: { label: 'Orange Money', color: 'orange', icon: 'fas fa-mobile-alt', rowClass: 'bg-orange' },
  EXPRESS_UNION: { label: 'Express Union', color: 'dark', icon: 'fas fa-money-check-alt', rowClass: 'bg-navy' },
  VIREMENT: { label: 'Virement', color: 'info', icon: 'fas fa-university', rowClass: 'bg-teal' },
  CHEQUE: { label: 'Chèque', color: 'secondary', icon: 'fas fa-money-check', rowClass: 'bg-gray' },
};

function modeMeta(mode: string | null | undefined): ModePaiementMeta {
  return (mode && MODE_PAIEMENT_META[mode]) || { label: mode || 'Inconnu', color: 'secondary', icon: 'fas fa-question-circle', rowClass: '' };
}

@Component({
  selector: 'app-historique-caisse',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ToastrModule],
  templateUrl: './historique-caisse.component.html',
  styleUrl: './historique-caisse.component.css'
})
export class HistoriqueCaisseComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données pour les dropdowns
  annees: Annee[] = [];
  dateByAnnee: Date[] = [];
  caissiers: Person[] = [];
  datesCaisse: Date[] = [];
  montantTotal: number = 0
  remise: number = 0;
  montantNetEnCaisse: number = 0;
  montantCodeMarchantMtn: number = 0;
  montantCodeMarchantOrange: number = 0;
  montantPaieEnEspece: number = 0;
  // Ventilation complete par mode de paiement (ESPECES, CARTE_BANCAIRE,
  // BON_ACHAT, MOBILE_MONEY, ORANGE_MONEY, EXPRESS_UNION, VIREMENT, CHEQUE)
  // - source unique utilisee par getPaymentStats() pour les cartes recap.
  // Les 3 champs montantXxx ci-dessus restent en compat mais sont derives
  // de cette map a chaque calculerTotal().
  totauxParMode: { [mode: string]: number } = {};
  // Bons d'achat emis en remplacement d'un rendu de monnaie (deja inclus
  // dans totauxParMode['ESPECES'] - aucune espece sortie du tiroir pour ce
  // montant), affiche separement pour transparence.
  montantBonEmisTotal: number = 0;
  ligneVente: CaisseItem[] = [];



  // Filtre actuel
  filter: CaisseFilter = {};

  // Données d'historique
  historiqueCaisse: Vente | null = null;
  ventes: Vente[] = [];
  filteredVentes: CaisseItem[] = [];
  users: User[] = [];
  // true si le dernier chargement de la liste des caissiers a echoue (a
  // distinguer du cas normal "aucun caissier dans cette compagnie").
  caissierLoadError = false;

  // État de l'interface
  loading = false;
  printing = false;
  vendeur!: string;
  isCaisse = false;
  userSession!: UserSession;

  // Configuration du tableau
  columns: TableColumn[] = [

    { field: 'numTicket', header: 'N° Ticket', sortable: true, filterable: true },
    { field: 'Ref', header: 'Référence', sortable: true, filterable: true },
    { field: 'libelle', header: 'Libellé', sortable: true, filterable: true },
    { field: 'quantite', header: 'Quantité', sortable: true, type: 'number' },
    { field: 'prixUnitaire', header: 'Prix Unitaire', sortable: true, type: 'number' },

    { field: 'modePaiement', header: 'Mode Paiement', sortable: true }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 50;
  totalItems = 0;

  // Recherche globale
  globalFilter = '';
  usercaisse!: User


  // Cache des modes de paiement
  private modePaiementCache = new Map<string, string>();

  constructor(
    private caisseService: HistoriqueCaisseService,
    private userService: UserService,
    private auth: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {

    const rawUser = this.auth.getUserFromStorage();
    if (rawUser) {
      // Remap userDTO → usersDTO
      const userSession: UserSession = {
        usersDTO: rawUser.usersDTO, // 👈 remap ici
        token: rawUser.token,
        permissions: rawUser.permissions,
        expiresAt: new Date(rawUser.expiresAt),
      };
      this.userSession = userSession;

      // Un compte sans "profil" assigne (typiquement l'admin de la compagnie,
      // qui n'a pas de profil de type CAISSE) doit quand meme voir l'ecran -
      // ne bloquer le chargement que sur la valeur du profil, jamais sur son
      // absence.
      const profil = this.userSession.usersDTO?.profil;
      console.log("profil =", profil?.code);
      this.loadInitialData(profil?.code ?? '');
      this.subscribeToServiceUpdates();
    }
    //if(roles==='CAISSE'){

    // }
    //console.log("role:", this.userService.getUserConnected();




  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(profil: string): void {
    const isCaisse = profil === 'CAISSIER';
    this.isCaisse = isCaisse;
    this.vendeur = isCaisse ? this.userSession.usersDTO.userName : '';

    const annees$ = isCaisse
      ? this.caisseService.getAllAnnees(this.vendeur)
      : this.caisseService.getAllAnneesCaisse();

    const users$ = this.caisseService.getCaissiers();
    console.log("liste Caissier....", users$);

    forkJoin({
      annees: annees$,
      users: users$

    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ annees, users }) => {
          this.annees = annees;
          this.users = isCaisse ? [] : users; // si profil CAISSE → vider les users
          this.caissierLoadError = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données initiales:', error);
          this.caissierLoadError = true;
          this.toastr.error('Impossible de charger la liste des caissiers ou des années de vente', 'Erreur');
        }
      });
  }

  private subscribeToServiceUpdates(): void {
    this.caisseService.moisByAnnee$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mois => {
        this.dateByAnnee = mois;
      });

    this.caisseService.datesCaisse$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dates => {
        this.datesCaisse = dates;
      });

    this.caisseService.historiqueCaisse$
      .pipe(takeUntil(this.destroy$))
      .subscribe(historique => {
        this.historiqueCaisse = historique;
        if (historique) {
          //.ventes = historique;
          // this.filteredVentes = [...this.ventes];
          //this.totalItems = this.ventes.length;
          //this.loadModePaiements();
        }
      });
  }

  // Gestionnaires d'événements pour les dropdowns
  onAnneeChange(): void {
    if (!this.filter.annee) {
      // Pas d'année sélectionnée, reset
      this.resetDateFilters();
      return;
    }

    this.resetDateFilters();

    const anneeId = this.filter.annee.id;
    if (this.isCaisse) {
      // Compte CAISSE : uniquement ses propres dates de vente. Se base sur
      // le role reel (this.isCaisse), pas sur la liste des caissiers - celle-ci
      // est vide pour un admin des qu'aucun autre compte CAISSE n'existe
      // encore, ce qui prenait ce meme chemin par erreur et cassait le
      // chargement pour tout admin/gerant d'une compagnie neuve.
      this.caisseService.getDateByAnnee(anneeId, this.vendeur)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: date => this.caisseService.updateDateByAnnee(date),
          error: err => console.error('Erreur lors du chargement des mois:', err)
        });
    } else {
      // Cas avec users, utilise getAllDateCaisse
      this.caisseService.getAllDateCaisse(anneeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: date => this.caisseService.updateDateByAnnee(date),
          error: err => console.error('Erreur lors du chargement des mois:', err)
        });
    }
  }

  private resetDateFilters(): void {
    this.filter.mois = undefined;
    this.filter.date = undefined;
    // this.filter.caissier = undefined; // si besoin, décommente
    this.dateByAnnee = [];
    this.datesCaisse = [];
  }

  onMoisChange(): void {
    if (this.filter.date) {
      this.filter.mois = undefined;
      this.datesCaisse = [];

      /**this.caisseService.getDatesCaisse(this.filter.mois.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dates) => {
            this.caisseService.updateDatesCaisse(dates);
          },
          error: (error) => {
            console.error('Erreur lors du chargement des dates:', error);
          }
        });*/
    }
  }

  // Générer l'historique
  genererHistorique(): void {
    console.log('Formulaire valide ? :', this.isFilterValid());
    console.log('Année :', this.filter.annee, 'Date :', this.filter.date);
    console.log('Vendeur sélectionné :', this.vendeur);

    // Optionnel : activer cette ligne si nécessaire
    // if (!this.isFilterValid()) return;

    // Un vendeur vide est un cas valide : vue "toute la boutique" pour un
    // admin/gerant n'ayant choisi aucun caissier precis dans la liste - le
    // backend l'interprete desormais correctement (voir HistoriqueCaisseService).
    if (this.usercaisse?.userName) {
      this.vendeur = this.usercaisse.userName;
    }

    this.loading = true;

    const anneeId = this.filter.annee?.id ?? 0;
    const date = this.filter.date ?? new Date();

    // si vendeur est un objet User, extraire son userName


    this.caisseService.getHistoriqueVenteByDate(anneeId, this.vendeur, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventes) => {
          this.ventes = ventes;
          this.loading = false;
          console.log("Historique ventes récupéré :", ventes);
          this.calculerTotal();
        },
        error: (error) => {
          console.error('Erreur lors de la génération de l\'historique:', error);
          this.loading = false;
        }
      });
  }
  //appelle les date corespondant a la caissiere 

  chargeAlldatesForCaissier(): void {
       //this.dateByAnnee=[];
       this.filteredVentes=[];
       this.montantTotal=0;
       this.montantNetEnCaisse=0;
       this.montantPaieEnEspece=0;
       this.montantCodeMarchantOrange=0;
       this.montantCodeMarchantMtn=0;
    const anneeId = this.filter.annee?.id ?? 0;
    // Retour a "-- Sélectionner --" (usercaisse null) = vue "toute la
    // boutique" - recharge les dates via l'endpoint boutique entiere (pas
    // /dates/{vendeur} qui exige un vendeur non vide dans l'URL).
    this.vendeur = this.usercaisse?.userName ?? '';
    const dates$ = this.usercaisse
      ? this.caisseService.getDates(this.vendeur, anneeId)
      : this.caisseService.getAllDateCaisse(anneeId);
    dates$.subscribe({
      next: (dates) => {
        console.log("Dates reçues :", dates);
        this.dateByAnnee = dates;
      },
      error: (err) => console.error(err)
    });
  }


  // Imprimer le détail - impression navigateur directe du recapitulatif deja
  // affiche (aucun endpoint backend de generation PDF n'existe pour cet ecran).
  imprimerDetail(): void {
    if (this.ventes.length === 0) {
      return;
    }
    window.print();
  }

  // Charger les modes de paiement pour tous les tickets
  private loadModePaiements(): void {
    const uniqueTickets = [...new Set(this.ventes.map(v => v.numeroTicket))];

    uniqueTickets.forEach(numTicket => {
      if (!this.modePaiementCache.has(numTicket)) {
        this.caisseService.getModePaiement(numTicket)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (modePaiement) => {
              this.modePaiementCache.set(numTicket, modePaiement);
            },
            error: (error) => {
              console.error(`Erreur lors du chargement du mode de paiement pour ${numTicket}:`, error);
            }
          });
      }
    });
  }

  // Obtenir le mode de paiement d'un ticket
  getModePaiement(numTicket: string): string {
    const modePaiement = this.modePaiementCache.get(numTicket);
    return modePaiement ? modePaiement : '';
  }

  // Obtenir la classe CSS pour la ligne selon le mode de paiement
  getRowClass(item: CaisseItem): string {
    return modeMeta(item.typePaiement).rowClass || 'bg-green';
  }

  // Validation du filtre
  isFilterValid(): boolean {
    return !!(this.filter.annee && this.filter.date);
  }

  // Filtrage global
  onGlobalFilter(): void {
    const filterValue = (this.globalFilter || '').toLowerCase().trim();

    if (!filterValue) {
      this.filteredVentes = [...this.ligneVente];
    } else {
      this.filteredVentes = this.ligneVente.filter(lg =>
        (lg.numeroTicket || '').toLowerCase().includes(filterValue) ||
        (lg.article?.reference || '').toLowerCase().includes(filterValue) ||
        (lg.article?.libelle || '').toLowerCase().includes(filterValue)
      );
    }

    this.totalItems = this.filteredVentes.length;
    this.currentPage = 1;

    // Debug : à décommenter si nécessaire
    console.log('Filtre appliqué sur:', filterValue);
    // console.log('Résultat:', this.filteredVentes);
  }

  // Pagination
  get paginatedVentes(): CaisseItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVentes.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Méthodes utilitaires
  getMoisLibelle(mois: Mois): string {
    return `${this.caisseService.getMoisLibelle(mois.typeMois)} ${mois.annee.id}`;
  }

  formatNumber(value: number): string {
    return this.caisseService.formatNumber(value);
  }

  formatDate(date: Date): string {
    return this.caisseService.formatDate(date);
  }

  calculMontantNetEncaisse(): number {
    return this.historiqueCaisse ?
      this.caisseService.calculMontantNetEncaisse(this.historiqueCaisse) : 0;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
  initiationItemsCaisse() {
    this.ligneVente = [];
    this.montantTotal = 0;
    this.montantNetEnCaisse = 0;
    this.remise = 0;
    this.montantPaieEnEspece = 0;
    this.montantCodeMarchantMtn = 0;
    this.montantCodeMarchantOrange = 0;
    this.totauxParMode = {};
    this.montantBonEmisTotal = 0;
  }

  // Ventile chaque vente par mode de paiement REEL (lignes v.paiements,
  // remplies cote backend depuis les lignes Paiement - voir
  // MapperDtoImpl.mapperVentByVenteDto). Avant ce fix, seul v.typePaiement
  // (une simple chaine "ESPECES + BON_ACHAT" pour un paiement mixte) etait
  // lu : aucune valeur ne correspondait plus a un mode precis des qu'une
  // vente combinait plusieurs moyens de paiement, faussant silencieusement
  // tous les totaux du recapitulatif.
  calculerTotal(): void {
    this.initiationItemsCaisse();
    this.ventes.forEach(v => {
      this.ligneVente.push(...v.items);
      this.filteredVentes = [...this.ligneVente];
      this.montantTotal += v.montantTotal;
      this.montantNetEnCaisse += v.montantNet;
      if (v.remise) this.remise += v.remise;

      if (v.paiements && v.paiements.length > 0) {
        v.paiements.forEach(p => {
          const mode = p.typePaiement || 'AUTRE';
          this.totauxParMode[mode] = (this.totauxParMode[mode] || 0) + (Number(p.montant) || 0);
        });
      } else if (v.typePaiement) {
        // Compat : vente sans ventilation par ligne (donnee ancienne ou
        // aucune ligne Paiement retrouvee cote serveur) - on retombe sur le
        // montant net entier attribue au mode declare.
        this.totauxParMode[v.typePaiement] = (this.totauxParMode[v.typePaiement] || 0) + (Number(v.montantNet) || 0);
      }

      // Bon d'achat EMIS en monnaie (et non recu du client comme paiement) :
      // aucune espece n'est sortie du tiroir pour ce montant, il faut donc
      // le rajouter aux especes reellement en caisse (a l'inverse d'un bon
      // ENCAISSE du client, deja compte a part via la ligne de paiement
      // BON_ACHAT ci-dessus).
      if (v.montantBonEmis && v.montantBonEmis > 0) {
        this.montantBonEmisTotal += v.montantBonEmis;
        this.totauxParMode['ESPECES'] = (this.totauxParMode['ESPECES'] || 0) + v.montantBonEmis;
      }
    });

    // Champs historiques conserves pour compat (peu de reutilisation directe).
    this.montantPaieEnEspece = this.totauxParMode['ESPECES'] || 0;
    this.montantCodeMarchantMtn = this.totauxParMode['MOBILE_MONEY'] || 0;
    this.montantCodeMarchantOrange = this.totauxParMode['ORANGE_MONEY'] || 0;
  }

  // Méthodes additionnelles à ajouter à votre composant

  // Obtenir le libellé du mode de paiement
  getModePaiementLabel(typePaiement: string | null | undefined): string {
    return modeMeta(typePaiement).label;
  }

  // Générer la plage de pages pour la pagination
  getPageRange(): number[] {
    const range: number[] = [];
    const maxPages = 5; // Nombre maximum de pages à afficher

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    // Ajuster si on est proche du début
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    return range;
  }

  // Statistiques par mode de paiement, TOUS modes confondus (carte, bon
  // d'achat, virement, cheque... pas seulement especes/MTN/Orange comme
  // avant) - source unique : totauxParMode, alimente par calculerTotal()
  // a partir des vraies lignes de paiement de chaque vente.
  getPaymentStats(): { mode: string; label: string; montant: number; color: string; icon: string }[] {
    return Object.keys(this.totauxParMode)
      .filter(mode => this.totauxParMode[mode] > 0)
      .map(mode => {
        const meta = modeMeta(mode);
        return { mode, label: meta.label, montant: this.totauxParMode[mode], color: meta.color, icon: meta.icon };
      })
      .sort((a, b) => b.montant - a.montant);
  }

  // Couleur associee a un mode de paiement (graphiques/badges).
  getPaymentColor(typePaiement: string | null | undefined): string {
    return modeMeta(typePaiement).color;
  }

  // Calculer le pourcentage d'un montant par rapport au total
  calculatePercentage(montant: number, total: number): number {
    return total > 0 ? (montant / total) * 100 : 0;
  }

  // Exporter les données vers CSV
  exportToCsv(): void {
    const csvData = this.filteredVentes.map(item => ({
      'N° Ticket': item.numeroTicket,
      'Référence': item.article.reference,
      'Libellé': item.article.libelle,
      'Quantité': item.quantite,
      'Prix Unitaire': item.prixUnitaire,
      'Mode Paiement': this.getModePaiementLabel(item.typePaiement || '')
    }));

    const csvString = this.convertToCSV(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historique_caisse_${this.formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Convertir les données en format CSV
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Ajouter les en-têtes
    csvRows.push(headers.join(','));

    // Ajouter les données
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.filter = {};
    this.globalFilter = '';
    this.currentPage = 1;
    this.filteredVentes = [];
    this.ventes = [];
    this.initiationItemsCaisse();
  }

  // Vérifier si une date est aujourd'hui
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  // Obtenir le nombre total d'articles
  getTotalArticles(): number {
    return this.ligneVente.reduce((total, item) => total + item.quantite, 0);
  }

  // Obtenir le nombre de tickets unique
  getUniqueTicketsCount(): number {
    const uniqueTickets = new Set(this.ligneVente.map(item => item.numeroTicket));
    return uniqueTickets.size;
  }

  // Formater la période sélectionnée
  getFormattedPeriod(): string {
    if (!this.filter.date) return '';

    const date = new Date(this.filter.date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return date.toLocaleDateString('fr-FR', options);
  }

  // Vérifier si des données sont disponibles
  hasData(): boolean {
    return this.ventes.length > 0;
  }
}
