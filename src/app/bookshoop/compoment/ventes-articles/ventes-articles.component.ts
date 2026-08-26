import { Component, ElementRef, ViewChild } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Produit } from '../../model/produit';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaisseItem } from '../../model/caisse-item';
import { Person } from '../../model/person';
import { Vente, LignePaiement } from '../../model/vente';
import { BarcodeService } from '../../service/barcode.service';
import { NotificationService } from '../../service/notification.service';
import { PrixArticlesService } from '../../service/prix-articles.service';
import { UserService } from '../../service/user-service.service';
import { PrintService } from '../../service/print.service';
import { StockServiceService } from '../../service/stock-service.service';
import jsPDF from 'jspdf';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { Route, Router } from '@angular/router';
import { User } from '../../model/user';
import { AuthService } from '../../../auth/auth.service';
import { BonAchatService } from '../../service/BonAchat.service';
import { BonAchat } from '../../model/bon-achat';
import { ConnectivityService } from '../../service/connectivity.service';
import { VenteArticlesOfflineService } from '../../service/vente-articles-offline.service';
import { SyncStatusBadgeComponent, SyncStatusView } from '../sync-status-badge/sync-status-badge.component';

// Une "vente en cours" tenue en memoire cote client - permet de mettre en
// attente le panier d'un client (ex: il va chercher un article oublie) pour
// servir un second client sans perdre le premier panier. N'existe pas cote
// backend tant que la vente n'est pas validee (aucune reservation de stock).
interface Panier {
  id: string;
  label: string;
  caisseItems: CaisseItem[];
  numeroTicket: string;
  client: any;
  typeRemise: string;
  remise: number;
  numerocommande: number;
}

const MAX_PANIERS = 5;

@Component({
  selector: 'app-ventes-articles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,CalendarModule, SyncStatusBadgeComponent],
  templateUrl: './ventes-articles.component.html',
  styleUrl: './ventes-articles.component.css'
})
export class VentesArticlesComponent {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
  private destroy$ = new Subject<void>();

  articleSearchRef!: Produit;

  // Forms
  venteForm!: FormGroup;
  articleForm!: FormGroup;
  bonAchatForm!: FormGroup;
  clientForm!: FormGroup;

  // Data
  caisseItems: CaisseItem[] = [];
  articles: Produit[] = [];
  filteredArticles: Produit[] = [];
  personnes: Person[] = [];
  typesPaiement: string[] = ['ESPECES', 'MOBILE_MONEY', 'ORANGE_MONEY', 'EXPRESS_UNION', 'CARTE_BANCAIRE', 'VIREMENT', 'CHEQUE', 'BON_ACHAT'];
  // Paiement mixte : plusieurs lignes (ex. especes + Orange Money + bon d'achat)
  lignesPaiement: LignePaiement[] = [];

  // UI State
  loading = false;
  showArticleModal = false;
  showPaiementModal = false;
  showBonAchatModal = false;
  showClientModal = false;
  showConfirmationModal = false;
  isLoading = false;

  // Vente data
  numeroTicket = '';
  montantTotal = 0;
  montantTotalApaye = 0;
  montantRemise = 0;
  typePaiementSelectionne = 'ESPECES';
  montantRecu = 0;
  monnaieRendue = 0;
  venteValidee!: Vente; // Pour stocker les données de la vente validée

  // Bon d'achat
  bonAchatCode = '';
  bonAchatValide = false;
  montantBonAchat = 0;
  resteApresBonAchat = 0;
  venteid!: number;
  venteCreee = false;
    numerocommande:number=0;
    user: User | null = null;
        userSession: any;

  // Ventes multiples en parallele (onglets)
  paniers: Panier[] = [];
  panierActifId = '';

  // Conversion du reliquat de monnaie en bon d'achat (a la place du rendu physique)
  bonAchatRenduNom = '';
  bonAchatRenduTelephone = '';
  bonAchatEmis: BonAchat | null = null;
  emissionBonEnCours = false;

  constructor(
    private fb: FormBuilder, private barcodeService: BarcodeService, private notificationService: NotificationService,
    private prixArticlesService: PrixArticlesService, private userService: UserService, private printService: PrintService,
    private stockService: StockServiceService,private router:Router,private authService: AuthService,
    private bonAchatService: BonAchatService,
    private connectivity: ConnectivityService,
    private venteArticlesOfflineService: VenteArticlesOfflineService
  ) {
    this.initializeForms();
    this.syncStatus$ = this.venteArticlesOfflineService.status$;
  }

  readonly syncStatus$: Observable<SyncStatusView>;

  forceSyncNow(): void {
    this.venteArticlesOfflineService.forceSyncNow();
  }

  ngOnInit(): void {
    this.userSession = this.authService.currentUserValue;
    if (this.userSession && this.userSession.usersDTO) {
      console.log(this.user)
      this.user = this.userSession.usersDTO;
      console.log("verification du stock");
    
    }
    this.genererNumeroTicket();
    this.paniers = [this.creerPanierVide('Vente 1')];
    this.panierActifId = this.paniers[0].id;
    this.chargerDonnees();
    this.focusBarcodeInput();
    // 🔁 Réagir à un article ajouté ailleurs
    this.prixArticlesService.articleAjoute$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chargerArticles(); // recharge la liste d’articles automatiquement
      });

    // Écouter les changements de valeur sur le champ 'remise'
    this.venteForm.get('remise')?.valueChanges.subscribe((nouvelleValeur) => {
      console.log('Nouvelle valeur de remise :', nouvelleValeur ?? 0);

      // Tu peux faire des traitements ici, ex : recalcul d’un total
      this.recalculerTotalAvecRemise(nouvelleValeur ?? 0 );
    });

    // Écouter les changements du type de remise
    this.venteForm.get('typeRemise')?.valueChanges.subscribe(value  => {
      console.log('Type de remise sélectionné :', value ?? 'taux');

      if (value  === 'taux' || value==null) {
        this.venteForm.get('remise')?.reset();
      } else  {
        this.venteForm.get('remise')?.reset();
      }
      
    });
  }
  recalculerTotalAvecRemise(remise: number) {
    if (this.venteForm.get('typeRemise')?.value === 'taux') {
      this.montantRemise = (this.montantTotal * remise / 100)
      this.montantTotalApaye = this.montantTotal - this.montantRemise;
    } else {
      this.montantRemise = (remise)
      this.montantTotalApaye = this.montantTotal - this.montantRemise;
    }

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private initializeForms(): void {
    this.venteForm = this.fb.group({
      barcode: [''],
      client: [''],
      dateSave: [new Date()],
      typeRemise: ['taux'], // valeur par défaut
      remise: [0, [Validators.min(0), Validators.max(100)]]
    });

    this.articleForm = this.fb.group({
      libelle: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]]
    });

    this.bonAchatForm = this.fb.group({
      personne: ['', Validators.required],
      montant: [0, [Validators.required, Validators.min(0)]],
      renduEspece: [0, [Validators.min(0)]]
    });

    this.clientForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: [''],
      email: ['', Validators.email]
    });
  }

  private genererNumeroTicket(): void {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    this.numeroTicket = `TKT${timestamp}`;
  }

  private async chargerDonnees(): Promise<void> {
    try {
      this.loading = true;
      // Simuler le chargement des données
      await this.chargerArticles();
      await this.chargerPersonnes();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      this.loading = false;
    }
  }
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.notificationService.error(message);
    this.isLoading = false;

  }
  resetArticles() {
    this.loading = true;
    this.articles = [];
    this.filteredArticles = [];
    if(!this.user) return;
    this.barcodeService.getProduitsAutoComplet(this.user.boutiqueid?? 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits) => {
          this.articles = produits;

          this.filteredArticles = [...this.articles];
          this.loading = false;
        },
        error: (error) => this.handleError('Erreur lors du chargement des produits', error)
      });
  }
  private async chargerArticles(): Promise<void> {
  if(!this.user) return;

    this.barcodeService.getProduitsAutoComplet(this.user.boutiqueid?? 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits) => {
          this.articles = produits;
          // Doit etre mis a jour ICI, dans le callback async, sinon cette
          // ligne s'executait avant meme que la reponse serveur n'arrive et
          // la liste affichee/recherchee (filteredArticles) restait figee
          // sur l'ancien chargement - un article fraichement approvisionne
          // ne se voyait alors qu'apres un rechargement complet de la page.
          this.filteredArticles = [...this.articles];
        },
        error: (error) => this.handleError('Erreur lors du chargement des produits', error)
      });
  }
  public getstockProduit(article: Produit) {
    let qte;
    console.log(article)
    if (!article.id) return;
    this.barcodeService.getStockcurrentProduit(article.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stock) => {
          qte = stock;


        },
        error: (error) => {
          this.handleError('Erreur lors du chargement du produit par sa référence', error);
        }
      });
    return qte;
  }

  private async chargerPersonnes(): Promise<void> {
    // Simuler un appel API

    this.barcodeService.getAllPersons().subscribe({
      next: (data: Person[]) => this.personnes = data,

      error: (err) => {
        this.handleError('Erreur lors du chargement des clients', err);
      },

    })
    /** this.personnes = [
       {
         id: 1,
         matricule: "00012",
         nom: 'Dupont',
         prenom: 'Jean',
         telephone: '123456789',
         email: 'jean.dupont@email.com'
       }
     ];*/
  }

  private focusBarcodeInput(): void {
    setTimeout(() => {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);
  }

  // Event handlers
// Event handlers
  onBarcodeInput(event: any): void {
    const barcode = event.target.value;
    if (barcode) {

       this.barcodeService.verificationNumeTicketForEcom(barcode).subscribe({
    next: (venteExistante:Vente) => {
      if (venteExistante && venteExistante.id) {
        this.numerocommande=venteExistante.numerocommande || 0;
        this.caisseItems=[...venteExistante.items];
      this.venteForm.patchValue({ barcode: '' });
      this.calculerMontantTotal();
        //alert('Ce numéro de ticket existe déjà avec l\'ID : ' + venteExistante.id);
        this.loading = false;
        return;
      }

    },
    error: (error) => {
      console.error('Erreur lors de la vérification du ticket :', error);
      alert('Erreur réseau lors de la vérification du ticket');
      this.loading = false;
      this.numerocommande=0;
    }
  });
      //this.rechercherArticleParCodeBarre(barcode);
    }
  }
  onSearchInput(event: any): void {

    const searchTerm = event.target.value.toLowerCase();
    this.filteredArticles = this.articles.filter(article =>
      article.libelle.toLowerCase().includes(searchTerm) ||
      article.reference.toLowerCase().includes(searchTerm)
    );
  }
  onSearchInputRef(ref: string): void {
    const reference = ref.trim();
    if (!reference) return;

    this.barcodeService.getArticleByReference(reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (article) => {
          if (!article || !article.id) {
            this.openArticleModal();
            return;
          }

          this.articleSearchRef = article;
          this.ajouterArticleVente(article);
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement du produit par sa référence', error);
        }
      });
  }


  onSearchInputReference(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if(!this.user) return;

    if (searchTerm.size >= 6) {
      console.log("size ")
      console.log()

      this.barcodeService.getProduitsAutoComplet(this.user.boutiqueid?? 0)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (produits) => this.articles = produits,
          error: (error) => this.handleError('Erreur lors du chargement des produits', error)
        });
      this.filteredArticles = [...this.articles];
    }

  }

  onQuantiteChange(item: CaisseItem, event: any): void {
    const newQuantite = parseInt(event.target.value);
    if (newQuantite > 0) {
      this.modifierQuantite(item, newQuantite);
    }
  }

  onPrixChange(item: CaisseItem, event: any): void {
    const newPrix = parseFloat(event.target.value);
    if (newPrix >= 0) {
      item.prixUnitaire = newPrix;
      item.montantTotal = item.quantite * newPrix;
      this.calculerMontantTotal();
    }
  }

  onMontantRecuInput(event: any): void {
    this.montantRecu = parseFloat(event.target.value) || 0;
    if (this.montantTotalApaye !== 0) {
      this.monnaieRendue = Math.max(0, this.montantRecu - this.montantTotalApaye);
    } else {
      this.monnaieRendue = Math.max(0, this.montantRecu - this.montantTotal);
    }

  }

  // Article methods
  private rechercherArticleParCodeBarre(barcode: string): void {
    const article = this.articles.find(a => a.reference === barcode);
    if (article) {
      this.ajouterArticleVente(article);
      this.venteForm.patchValue({ barcode: '' });
    } else {
      //alert('Article non trouvé');
      this.openArticleModal();
    }
  }



  ajouterArticleVente(article: Produit): void {

    // Vérification du stock avant ajout
    if (article.stockFinal <= 0) {
      this.notificationService.error('Stock insuffisant pour cet article');
      return;
    }

    let stockfinal = 0;
    const productid = article.id ?? 0;
    this.barcodeService.getStockcurrentProduit(productid).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stock) =>
          article.stockFinal = stock,
        error: (error) => this.handleError('Erreur lors du chargement des produits', error)
      });


    const existingItem = this.caisseItems.find(item => item.article.id === article.id);

    if (existingItem) {
      const nouvelleQuantite = existingItem.quantite + 1;
      // Vérifier si la nouvelle quantité ne dépasse pas le stock
      if (nouvelleQuantite > article.stockFinal) {
        this.notificationService.warning(`Stock insuffisant. Stock disponible: ${article.stockFinal}`);
        return;
      }
      this.modifierQuantite(existingItem, nouvelleQuantite);
    } else {
      
      const newItem: CaisseItem = {
        //id: Date.now().toString(),
        article: article,
        quantite: 1,
        prixUnitaire: article.prixVenteTTC,
        montantTotal: article.prixVenteTTC

      };
     

      this.caisseItems.push(newItem);
    }
    this.calculerMontantTotal();
    
    //this.showArticleModal = false;
    //this.focusBarcodeInput();
  }
   reduireLibelle(libelle: string, maxLength: number = 25): string {
  //if (!libelle) return '';
  console.log(libelle);
  return libelle.length > maxLength ? libelle.slice(0, maxLength) + '...' : libelle;
}
  ajouterArticleNonStock(): void {
    if (this.articleForm.valid) {
      const formValue = this.articleForm.value;
      const articleLibre: Produit = {
        id: Date.now(),
        libelle: formValue.libelle,
        reference: `LIBRE_${Date.now()}`,
        prixVenteTTC: formValue.prixUnitaire,
        stockFinal: 999,
        prixVenteModifiable: true,
        pacquets: false,
        quantiteByPacquet: 0,
        quantitePrete: 0,
        quantiteLivree: 0,
        prixVenteNet: 1500,
        deletes: false,
        remise: 0,
        tva: 0
      };

      const newItem: CaisseItem = {
        //id: Date.now().toString(),
        article: articleLibre,
        quantite: formValue.quantite,
        prixUnitaire: formValue.prixUnitaire,
        montantTotal: formValue.quantite * formValue.prixUnitaire
      };

      this.caisseItems.push(newItem);
      this.calculerMontantTotal();
      this.articleForm.reset();
      this.showArticleModal = false;
      this.focusBarcodeInput();
    }
  }

  modifierQuantite(item: CaisseItem, nouvelleQuantite: number): void {
    if (nouvelleQuantite > 0) {
      // Vérifier le stock disponible
      if (nouvelleQuantite > item.article.stockFinal) {
        this.notificationService.warning(`Stock insuffisant. Stock disponible: ${item.article.stockFinal}`);
        return;
      }
      item.quantite = nouvelleQuantite;
      item.montantTotal = item.quantite * item.prixUnitaire;
      this.calculerMontantTotal();
    }
  }

  supprimerItem(index: number): void {
    this.caisseItems.splice(index, 1);
    this.calculerMontantTotal();
  }

  // Modal methods
  openArticleModal(): void {
    this.showArticleModal = true;
    this.filteredArticles = [...this.articles];
    // Recharge depuis le serveur a chaque ouverture (pas seulement au
    // chargement initial de la page) - sinon un article approvisionne
    // pendant que la caisse est deja ouverte reste invisible tant que la
    // page n'est pas rechargee manuellement.
    this.chargerArticles();
  }

  openPaiementModal(type: string): void {
    this.typePaiementSelectionne = type === 'especes' ? 'ESPECES' : 'CARTE_BANCAIRE';
    this.montantRecu = 0;
    this.monnaieRendue = 0;
    this.montantTotalApaye = this.montantTotal - this.montantRemise;

    if (this.bonAchatValide && this.montantBonAchat > 0) {
      // Un bon d'achat verifie sur l'ecran principal devient la premiere
      // ligne de paiement ; le reste (s'il y en a) suit sur le mode choisi.
      this.lignesPaiement = [
        { typePaiement: 'BON_ACHAT', montant: this.montantBonAchat, reference: this.bonAchatCode }
      ];
      if (this.resteApresBonAchat > 0) {
        this.lignesPaiement.push({
          typePaiement: this.typePaiementSelectionne,
          montant: this.resteApresBonAchat,
          reference: ''
        });
      }
    } else {
      // Une seule ligne pre-remplie sur le montant total : le cas courant
      // (un seul mode de paiement) reste a un clic. Le caissier peut ajouter
      // d'autres lignes pour un paiement mixte (espece+telephone+bon d'achat).
      this.lignesPaiement = [{
        typePaiement: this.typePaiementSelectionne,
        montant: this.montantTotalApaye,
        reference: ''
      }];
    }

    this.bonAchatRenduNom = '';
    this.bonAchatRenduTelephone = '';
    this.bonAchatEmis = null;
    this.showPaiementModal = true;
  }

  // Convertit le reliquat de monnaie (rendu impossible faute de
  // piece/billet) en bon d'achat au nom du client, au lieu de le lui rendre
  // en especes. N'affecte pas les lignes de paiement de la vente (deja
  // couverte) - emet juste un avoir separe.
  convertirRenduEnBonAchat(): void {
    const montant = this.monnaieARendre();
    if (montant <= 0 || !this.bonAchatRenduNom.trim() || this.emissionBonEnCours) return;

    this.emissionBonEnCours = true;
    this.bonAchatService.emettreDepuisRendu(
      this.bonAchatRenduNom.trim(),
      this.bonAchatRenduTelephone.trim() || undefined,
      montant,
      this.numeroTicket
    ).subscribe({
      next: (bon) => {
        this.bonAchatEmis = bon;
        this.emissionBonEnCours = false;
      },
      error: (err) => {
        this.handleError('Erreur lors de l\'émission du bon d\'achat', err);
        this.emissionBonEnCours = false;
      }
    });
  }

  // Imprime le bon (ticket PDF avec code-barres) juste emis pour le
  // reliquat. Le backend marque le bon comme imprime dans le meme appel -
  // une deuxieme impression est bloquee (voir BonAchatController#telechargerTicket).
  imprimerBonEmis(): void {
    if (!this.bonAchatEmis?.id || this.bonAchatEmis.imprime) return;
    const bon = this.bonAchatEmis;
    const fenetre = window.open('', '_blank');
    this.bonAchatService.telechargerTicket(bon.id!).subscribe({
      next: (blob) => {
        this.printService.imprimerAvecPrevisualisation(blob, fenetre);
        bon.imprime = true;
      },
      error: (err) => {
        fenetre?.close();
        this.handleError('Erreur lors de l\'impression du bon d\'achat', err);
      }
    });
  }

  // Paiement mixte : gestion des lignes de paiement du modal
  ajouterLignePaiement(): void {
    this.lignesPaiement.push({
      typePaiement: 'ESPECES',
      montant: this.resteAPayer(),
      reference: ''
    });
  }

  supprimerLignePaiement(index: number): void {
    if (this.lignesPaiement.length <= 1) return;
    this.lignesPaiement.splice(index, 1);
  }

  totalPaye(): number {
    return this.lignesPaiement.reduce((sum, l) => sum + (Number(l.montant) || 0), 0);
  }

  resteAPayer(): number {
    return Math.max(0, this.montantTotalApaye - this.totalPaye());
  }

  monnaieARendre(): number {
    return Math.max(0, this.totalPaye() - this.montantTotalApaye);
  }

  paiementValide(): boolean {
    if (this.lignesPaiement.length === 0) return false;
    if (this.totalPaye() + 0.01 < this.montantTotalApaye) return false;
    return this.lignesPaiement.every(l =>
      l.typePaiement !== 'BON_ACHAT' || !!(l.reference && l.reference.trim().length > 0)
    );
  }

  // ===== Ventes multiples en parallele (onglets) =====
  private creerPanierVide(label: string): Panier {
    return {
      id: 'p' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      label,
      caisseItems: [],
      numeroTicket: this.numeroTicket,
      client: null,
      typeRemise: 'taux',
      remise: 0,
      numerocommande: 0
    };
  }

  // Enregistre l'etat de travail courant (caisseItems, client, remise...)
  // dans le panier actif avant de basculer sur un autre onglet.
  private snapshotPanierActif(): void {
    const panier = this.paniers.find(p => p.id === this.panierActifId);
    if (!panier) return;
    panier.caisseItems = this.caisseItems;
    panier.numeroTicket = this.numeroTicket;
    panier.client = this.venteForm.get('client')?.value;
    panier.typeRemise = this.venteForm.get('typeRemise')?.value ?? 'taux';
    panier.remise = this.venteForm.get('remise')?.value ?? 0;
    panier.numerocommande = this.numerocommande;
  }

  private chargerPanier(panier: Panier): void {
    this.caisseItems = panier.caisseItems;
    this.numeroTicket = panier.numeroTicket;
    this.numerocommande = panier.numerocommande;
    this.venteForm.patchValue({
      client: panier.client,
      typeRemise: panier.typeRemise,
      remise: panier.remise
    }, { emitEvent: false });
    this.panierActifId = panier.id;
    this.calculerMontantTotal();
  }

  nouveauPanier(): void {
    if (this.paniers.length >= MAX_PANIERS) {
      this.notificationService.warning(`Maximum ${MAX_PANIERS} ventes en parallèle`);
      return;
    }
    this.snapshotPanierActif();
    this.genererNumeroTicket();
    const panier = this.creerPanierVide(`Vente ${this.paniers.length + 1}`);
    this.paniers.push(panier);
    this.chargerPanier(panier);
    this.venteForm.patchValue({ barcode: '' }, { emitEvent: false });
    this.focusBarcodeInput();
  }

  selectionnerPanier(panier: Panier): void {
    if (panier.id === this.panierActifId) return;
    this.snapshotPanierActif();
    this.chargerPanier(panier);
    this.focusBarcodeInput();
  }

  fermerPanier(panier: Panier, event: Event): void {
    event.stopPropagation();
    if (panier.caisseItems.length > 0
      && !confirm(`"${panier.label}" contient ${panier.caisseItems.length} article(s) non validé(s). Fermer quand même ?`)) {
      return;
    }
    const idx = this.paniers.findIndex(p => p.id === panier.id);
    if (idx === -1) return;
    const etaitActif = panier.id === this.panierActifId;
    this.paniers.splice(idx, 1);

    if (!etaitActif) return;
    if (this.paniers.length === 0) {
      this.genererNumeroTicket();
      const nouveau = this.creerPanierVide('Vente 1');
      this.paniers.push(nouveau);
      this.chargerPanier(nouveau);
    } else {
      this.chargerPanier(this.paniers[Math.max(0, idx - 1)]);
    }
  }

  // Calculs
  private calculerMontantTotal(): void {
    let total = this.caisseItems.reduce((sum, item) => sum + item.montantTotal, 0);
    this.montantTotal=total
   

   const remise = this.venteForm.get('remise')?.value || 0;
    if (remise > 0) {
       this.recalculerTotalAvecRemise(remise);
     // total = total * (1 - remise / 100);
    }
 
    
   
  }

  getMontantEnLettres(): string {
    // Implémentation simplifiée pour la conversion en lettres
    if (this.montantTotal === 0) return '';

    // Fonction basique de conversion (peut être améliorée)
    const montant = Math.floor(this.montantTotal);
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    const centaines = ['', 'cent', 'deux-cent', 'trois-cent', 'quatre-cent', 'cinq-cent', 'six-cent', 'sept-cent', 'huit-cent', 'neuf-cent'];

    if (montant < 10) {
      return `${unites[montant]} franc${montant > 1 ? 's' : ''} CFA`;
    } else if (montant < 1000) {
      return `${montant} francs CFA`;
    } else {
      return `${montant.toLocaleString('fr-FR')} francs CFA`;
    }
  }

  // Bon d'achat methods
  // Montant reellement du affiche a l'ecran (reproduit la condition du
  // template : Total à payer = montantTotalApaye seulement si une remise
  // est appliquee, sinon montantTotal).
  private montantDuAffiche(): number {
    const remise = this.venteForm.get('remise')?.value || 0;
    return remise > 0 ? this.montantTotalApaye : this.montantTotal;
  }

  verifierBonAchat(): void {
    if (!this.bonAchatCode) return;
    this.bonAchatValide = false;

    this.bonAchatService.verifierCode(this.bonAchatCode.trim()).subscribe({
      next: (bon) => {
        const disponible = bon.montantTotal - (bon.montantUtilise ?? 0);
        const montantDu = this.montantDuAffiche();
        this.montantBonAchat = Math.min(disponible, montantDu);
        this.resteApresBonAchat = Math.max(0, montantDu - this.montantBonAchat);
        this.bonAchatValide = true;
      },
      error: (err) => {
        this.bonAchatValide = false;
        this.notificationService.error(err.error?.message || 'Bon d\'achat invalide ou introuvable');
      }
    });
  }

  // Client methods
  creerClient(): void {
    if (this.clientForm.valid) {
      const nouveauClient: Person = {
        // id: Date.now(),
        ...this.clientForm.value
      };
      this.barcodeService.createPerson(nouveauClient).subscribe({
        next: (cl: Person) => {
          if (cl) {
            this.personnes.push(cl);
          }
        },
        error: (erro) => {
          this.handleError('Erreur de creation client', nouveauClient.nom);
        }
      });
      this.personnes.push(nouveauClient);
      this.venteForm.patchValue({ client: nouveauClient.id });
      this.clientForm.reset();
      this.showClientModal = false;
    }
  }

  // Vente methods
   validerVente(): void {
  if (this.caisseItems.length === 0) {
    alert('Aucun article dans le panier');
    return;
  }

  if (!this.verifierStockAvantVente() && this.numerocommande===0) {
    alert('Problème stock vérification');
    return;
  }

  if (!this.paiementValide()) {
    alert('Le total des paiements doit couvrir le montant à payer (et un code de bon d\'achat est requis pour une ligne "BON_ACHAT")');
    return;
  }

  this.loading = true;

  const procederEnregistrement = () => {
    this.enregistrerVente().then(() => {
      console.log('Vente enregistrée avec succès');
    }).catch(error => {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
      alert('Erreur lors de l\'enregistrement de la vente');
    }).finally(() => {
      this.loading = false;
    });
  };

  // Hors-ligne (ou backend injoignable) : impossible de verifier un
  // eventuel doublon de ticket au prealable - on l'accepte (le numero est
  // deja base sur un timestamp, risque de collision negligeable) plutot
  // que de bloquer toute la vente sur une simple coupure reseau.
  if (!this.connectivity.isOnline || !this.connectivity.isBackendAvailable) {
    procederEnregistrement();
    return;
  }

  // Vérifie si une vente avec ce ticket existe déjà
  this.barcodeService.verificationNumeTicket(this.numeroTicket).subscribe({
    next: (venteExistante) => {
      if (venteExistante && venteExistante.id) {
        this.venteid=venteExistante.id;
       alert('Ce numéro de ticket existe déjà avec l\'ID : ' + venteExistante.id);
        this.loading = false;
        return;
      }

      // Aucun ticket existant, procéder à l'enregistrement
      procederEnregistrement();
    },
    error: (error) => {
      console.error('Erreur lors de la vérification du ticket, poursuite hors-ligne :', error);
      procederEnregistrement();
    }
  });
}
  private checkMontantApaye(): number {
    if (this.montantTotalApaye == 0) {
      return this.montantTotal;
    }
    return this.montantTotalApaye;
  }
  private async enregistrerVente(): Promise<void> {
    const userinsert = this.userService.getUserConnected();

    // Montant recu/monnaie rendue affiches sur le ticket = agregats des
    // lignes de paiement mixte (le backend valide/persiste ces lignes
    // individuellement via venteValidee.paiements).
    this.montantRecu = this.totalPaye();
    this.monnaieRendue = this.monnaieARendre();

    // Stocker les données de la vente pour l'impression
    this.venteValidee = {
      numeroTicket: this.numeroTicket,
      date: this.venteForm.get('dateSave')?.value,
      items: [...this.caisseItems],
      montantTotal: this.montantTotal,
      typePaiement: this.lignesPaiement.map(l => l.typePaiement).filter((v, i, a) => a.indexOf(v) === i).join(' + '),
      paiements: this.lignesPaiement.map(l => ({
        typePaiement: l.typePaiement,
        montant: Number(l.montant) || 0,
        reference: l.reference || undefined
      })),
      montantRecu: this.montantRecu,
      monnaieRendue: this.monnaieRendue,
      montantNet: this.checkMontantApaye(),
      client: this.getDefautClient(),
      userinsert: userinsert.username,
      remise: this.montantRemise || 0,
      statut: 'TERMINEE'
    };

    try {
      // Enregistre directement si le backend est joignable, sinon met la
      // vente en file locale (voir VenteArticlesOfflineService) - venteid
      // vaut 0 tant que la vente n'a pas encore ete synchronisee.
      const { venteid } = await this.venteArticlesOfflineService.enregistrer(this.venteValidee, this.numerocommande);
      this.venteid = venteid;
      this.showPaiementModal = false;
      this.showConfirmationModal = true;
    } catch (error) {
      this.handleError('Erreur lors de la creation de vente', error);
    }
  }

  //verification ticket
  verificationNumeTicket(){
    setTimeout(() => {
    this.barcodeService.verificationNumeTicket(this.numeroTicket).subscribe({
      next: data => {
       this.venteid=data.id ?? 0;

    
      },
      error: err => {
        console.error('Erreur lors de la récupération des prix', err);
      }
    });
  }, 500); // délai de  5 milli secondes
}



  // 8. Ajoutez une méthode pour actualiser un article spécifique
  private actualiserArticleStock(articleId: number): void {
    this.barcodeService.getArticleById(articleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articleMisAJour: Produit) => {
          // Mettre à jour l'article dans la liste
          const index = this.articles.findIndex(a => a.id === articleId);
          if (index !== -1) {
            this.articles[index] = articleMisAJour;
          }

          // Mettre à jour aussi dans les articles filtrés
          const filteredIndex = this.filteredArticles.findIndex(a => a.id === articleId);
          if (filteredIndex !== -1) {
            this.filteredArticles[filteredIndex] = articleMisAJour;
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'actualisation de l\'article:', error);
        }
      });
  }


  // 9. Méthode pour recharger tous les stocks après une vente
  private rechargerStocks(): void {
    //let articlesIds: number[] = this.caisseItems.map(item => item.article.id); 
    let articlesIds: number[] = this.caisseItems
      .map(item => item.article.id)
      .filter((id): id is number => id !== undefined);

    articlesIds.forEach((id) => {
      this.actualiserArticleStock(id);
    });
  }
  // 6. Ajoutez une méthode pour vérifier le stock avant validation
  private verifierStockAvantVente(): boolean {
    for (const item of this.caisseItems) {
      if (item.quantite > item.article.stockFinal) {
        this.notificationService.error(
          `Stock insuffisant pour ${item.article.libelle}. Stock disponible: ${item.article.stockFinal}`
        );
        return false;
      }
    }
    return true;
  }
  private getDefautClient(): Person | undefined {
    const clientId = this.venteForm.get('client')?.value;
    if (clientId) {
      const client = this.personnes.find(p => p.id == clientId);
      return client;
    }
    const clientDefaut: Person = {
      matricule: "0000000",
      nom: 'Client de passage',
      prenom: "",
      telephone: "0000000",
      email: ""

    }
    return clientDefaut;
  }
  private getClientInfo(): string {
    const clientId = this.venteForm.get('client')?.value;
    if (clientId) {
      const client = this.personnes.find(p => p.id == clientId);
      return client ? `${client.nom} ${client.prenom}` : 'Client de passage';
    }
    return 'Client de passage';
  }



/**refreshPage(): void {
   this.loading = true;
   this.showConfirmationModal = false;
  this.router.navigate([this.router.url]); // recharge la même route
  this.loading = false;
}**/
refreshApplication(): void {
   this.loading = true;
   this.showConfirmationModal = false;
  //this.router.navigate([this.router.url]); // recharge la même route
  this.loading = false;
  window.location.reload();

}

 async nouvelleVente(): Promise<void> {
  this.loading = true;

  // Actualisation du stock de chaque article (asynchrone en parallèle si nécessaire)
  const articlesValides = this.caisseItems.filter(item => item.article?.id && item.quantite);
  const delaiTotal = articlesValides.length * 100;

  console.log(`Attente de ${delaiTotal} ms avant de passer à la tâche suivante...`);

  // Lancement des mises à jour sans attendre leur résultat individuellement
  for (const item of articlesValides) {
    this.actualiserArticleStock(item.article.id!);
  }

  await this.attendre(delaiTotal);

  // Réinitialisation des données de vente

   // Écouter les changements de valeur sur le champ 'remise'
    this.venteForm.get('remise')?.valueChanges.subscribe((nouvelleValeur) => {
      console.log('Nouvelle valeur de remise :', nouvelleValeur ?? 0);

      // Tu peux faire des traitements ici, ex : recalcul d’un total
      this.recalculerTotalAvecRemise(nouvelleValeur ?? 0 );
    });

    // Écouter les changements du type de remise
    this.venteForm.get('typeRemise')?.valueChanges.subscribe(value  => {
      console.log('Type de remise sélectionné :', value ?? 'taux');

      if (value  === 'taux' || value==null) {
        this.venteForm.get('remise')?.reset();
      } else  {
        this.venteForm.get('remise')?.reset();
      }
      
    });
  this.montantTotal = 0;
   this.venteForm.get('remise')?.reset();
  this.venteForm.get('typeRemise')?.setValue('taux');
  this.venteForm.reset();
  this.venteForm.reset({
  typeRemise: 'taux',
  // Autres champs par défaut si besoin
}); 



  this.venteValidee = {
    numeroTicket: "",
    date: new Date(),
    items: [],
    montantTotal: 0,
    typePaiement: '',
    montantRecu: 0,
    monnaieRendue: 0,
    montantNet: 0,
    client: undefined,
    userinsert: '',
    remise: this.montantRemise || 0,
    statut: "TERMINEE"
  };

  // Réinitialisation des champs de l'écran
  this.caisseItems = [];
  this.venteForm.reset();
  this.bonAchatCode = '';
  this.bonAchatValide = false;
  this.montantBonAchat = 0;
  this.resteApresBonAchat = 0;
  this.showConfirmationModal = false;
  this.articles = [];

  // Rechargement
  await this.chargerArticles(); // ← si `chargerArticles` est asynchrone
  this.genererNumeroTicket();

  // La vente de cet onglet vient d'être validée : on le remet à vide pour
  // le prochain client plutôt que de le faire disparaître (les autres
  // ventes en attente dans les autres onglets ne sont pas affectées).
  const panierActif = this.paniers.find(p => p.id === this.panierActifId);
  if (panierActif) {
    panierActif.caisseItems = [];
    panierActif.numeroTicket = this.numeroTicket;
    panierActif.client = null;
    panierActif.typeRemise = 'taux';
    panierActif.remise = 0;
    panierActif.numerocommande = 0;
  }
  this.numerocommande = 0;

  this.focusBarcodeInput();
  
  this.loading = false;
 
}


  // Print & Download methods
  //
  // venteid === 0 signifie que la vente est encore en file d'attente
  // (voir VenteArticlesOfflineService, hors-ligne ou backend injoignable
  // au moment de la validation) - impossible de demander un ticket au
  // backend puisqu'aucune facture n'y existe encore. Le ticket est alors
  // genere directement depuis venteValidee, cote client, sans appel reseau.
  imprimerTicket(ticketId: number): void {
    if (!this.venteid) {
      this.imprimerTicketLocal();
      return;
    }

    // Ouverture synchrone au clic - sinon le navigateur bloque le popup
    // une fois que le blob (recupere de facon asynchrone) est pret.
    const fenetre = window.open('', '_blank');
    this.barcodeService.downloadTicketVenteTXT(this.venteid).subscribe({
      next: (blob) => {
        const file = new Blob([blob], { type: 'text/plain;charset=utf-8' });
        this.printService.imprimerAvecPrevisualisation(file, fenetre);
      },
      // Sans ce handler, un echec cote serveur laissait l'onglet ouvert
      // vide (about:blank) sans aucune explication pour le caissier.
      error: (err) => {
        fenetre?.close();
        this.notificationService.warning('⚠️ Impression ticket local');
        this.imprimerTicketLocal();
      }
    });
  }

  telechargerTicket(ticketId: number): void {
    if (!this.venteid) {
      const ticket = this.genererTicketTexte(this.venteValidee);
      const blob = new Blob([ticket], { type: 'text/plain;charset=utf-8' });
      this.telechargerBlob(blob, `ticket_${this.venteValidee.numeroTicket}.txt`);
      return;
    }

    this.barcodeService.downloadTicketVenteTXT(this.venteid).subscribe({
      error: (err) => this.handleError('Erreur lors de la génération du ticket', err),
      next: (blob) => {
        const file = new Blob([blob], { type: 'text/plain;charset=utf-8' });
        this.telechargerBlob(file, `ticket-vente-${this.venteid}.txt`);
      }
    });
  }

  private imprimerTicketLocal(): void {
    const ticket = this.genererTicketTexte(this.venteValidee);
    const blob = new Blob([ticket], { type: 'text/plain;charset=utf-8' });
    this.printService.imprimerAvecPrevisualisation(blob);
  }

  private telechargerBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montant || 0);
  }

  /** Genere le contenu texte du ticket entierement cote client, sans appel reseau. */
  private genererTicketTexte(vente: Vente): string {
    const ligne = (texte: string) => texte + '\n';
    const sep = '================================\n';

    let ticket = '';
    ticket += ligne('╔════════════════════════════════╗');
    ticket += ligne('║     TICKET DE CAISSE           ║');
    ticket += ligne('╚════════════════════════════════╝');
    ticket += ligne('');
    ticket += sep;

    const clientNom = vente.client ? `${vente.client.nom} ${vente.client.prenom || ''}`.trim() : 'Client de passage';

    ticket += ligne(`Client    : ${clientNom}`);
    ticket += ligne(`Caissier  : ${vente.userinsert}`);
    ticket += ligne(`Date      : ${new Date(vente.date).toLocaleString('fr-FR')}`);
    ticket += ligne(`Ticket N° : ${vente.numeroTicket}`);
    ticket += sep;

    ticket += ligne('ARTICLES:');
    ticket += ligne('');

    vente.items.forEach((item, index) => {
      const numero = (index + 1).toString().padStart(2, ' ');
      ticket += ligne(`${numero}. ${item.article.libelle}`);
      ticket += ligne(`    ${item.quantite.toFixed(2)} x ${this.formatMontant(item.prixUnitaire)} = ${this.formatMontant(item.montantTotal)}`);
    });

    ticket += sep;
    ticket += ligne(`Sous-total : ${this.formatMontant(vente.montantTotal)} FCFA`);

    if (vente.remise && vente.remise > 0) {
      ticket += ligne(`Remise     : ${this.formatMontant(vente.remise)} FCFA`);
      ticket += ligne(`TOTAL      : ${this.formatMontant(vente.montantNet)} FCFA`);
    } else {
      ticket += ligne(`TOTAL      : ${this.formatMontant(vente.montantTotal)} FCFA`);
    }

    ticket += ligne(`Articles   : ${vente.items.length}`);
    ticket += ligne(`Paiement   : ${vente.typePaiement}`);

    if (vente.typePaiement === 'ESPECES') {
      ticket += ligne(`Reçu       : ${this.formatMontant(vente.montantRecu)} FCFA`);
      ticket += ligne(`Rendu      : ${this.formatMontant(vente.monnaieRendue)} FCFA`);
    }

    ticket += sep;
    ticket += ligne('  Les marchandises vendues ne');
    ticket += ligne('  sont ni reprises ni échangées');
    ticket += ligne('');
    ticket += ligne('      Merci et à bientôt !');

    if (!this.venteid) {
      ticket += '\n' + sep;
      ticket += ligne('⚠️  VENTE EN ATTENTE DE SYNCHRONISATION');
      ticket += ligne('Sync auto dès reconnexion serveur');
    }

    return ticket;
  }



  private genererTicketPDF(vente: any): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Format ticket de caisse (80mm de largeur)
    });

    // Configuration des polices et couleurs
    doc.setFont('helvetica');
    doc.setFontSize(10);

    let yPosition = 10;
    const lineHeight = 4;
    const pageWidth = 80;
    const margin = 5;

    // En-tête du magasin
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    this.addCenteredText(doc, 'POINT DE VENTE', yPosition, pageWidth);
    yPosition += lineHeight + 2;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    this.addCenteredText(doc, 'Votre magasin de confiance', yPosition, pageWidth);
    yPosition += lineHeight;
    this.addCenteredText(doc, 'Tel: +237 6XX XX XX XX', yPosition, pageWidth);
    yPosition += lineHeight + 3;

    // Ligne de séparation
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;

    // Informations du ticket
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ticket N°: ${vente.numeroTicket}`, margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    const dateStr = vente.date.toLocaleDateString('fr-FR') + ' ' +
      vente.date.toLocaleTimeString('fr-FR');
    doc.text(`Date: ${dateStr}`, margin, yPosition);
    yPosition += lineHeight;

    doc.text(`Client: ${vente.client}`, margin, yPosition);
    yPosition += lineHeight;

    if (vente.remise > 0) {
      doc.text(`Remise: ${vente.remise}%`, margin, yPosition);
      yPosition += lineHeight;
    }

    yPosition += 2;

    // Ligne de séparation
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;

    // Articles
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ARTICLES', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');

    vente.items.forEach((item: CaisseItem) => {
      // Nom de l'article
      const articleLines = this.splitText(doc, item.article.libelle, pageWidth - 2 * margin);
      articleLines.forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Détails : quantité x prix = total
      const detailText = `${item.quantite} x ${this.formatCurrency(item.prixUnitaire)} = ${this.formatCurrency(item.montantTotal)}`;
      doc.text(detailText, margin + 2, yPosition);
      yPosition += lineHeight + 1;
    });

    yPosition += 2;

    // Ligne de séparation
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;

    // Totaux
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    const sousTotal = vente.items.reduce((sum: number, item: CaisseItem) => sum + item.montantTotal, 0);
    doc.text(`Sous-total: ${this.formatCurrency(sousTotal)}`, margin, yPosition);
    yPosition += lineHeight;

    if (vente.remise > 0) {
      const montantRemise = sousTotal * vente.remise / 100;
      doc.text(`Remise (${vente.remise}%): -${this.formatCurrency(montantRemise)}`, margin, yPosition);
      yPosition += lineHeight;
    }

    doc.setFontSize(11);
    doc.text(`TOTAL: ${this.formatCurrency(vente.montantTotal)}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Paiement
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mode de paiement: ${this.getTypePaiementLibelle(vente.typePaiement)}`, margin, yPosition);
    yPosition += lineHeight;

    if (vente.typePaiement === 'ESPECES') {
      doc.text(`Montant reçu: ${this.formatCurrency(vente.montantRecu)}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Monnaie rendue: ${this.formatCurrency(vente.monnaieRendue)}`, margin, yPosition);
      yPosition += lineHeight;
    }

    yPosition += 3;

    // Ligne de séparation
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;

    // Pied de page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    this.addCenteredText(doc, 'Merci pour votre visite !', yPosition, pageWidth);
    yPosition += lineHeight;
    this.addCenteredText(doc, 'Conservez votre ticket', yPosition, pageWidth);
    yPosition += lineHeight + 2;

    // Montant en lettres
    doc.setFontSize(7);
    const montantEnLettres = this.getMontantEnLettres();
    if (montantEnLettres) {
      const lettresLines = this.splitText(doc, montantEnLettres, pageWidth - 2 * margin);
      lettresLines.forEach((line: string) => {
        this.addCenteredText(doc, line, yPosition, pageWidth);
        yPosition += lineHeight - 1;
      });
    }

    return doc;
  }

  private addCenteredText(doc: jsPDF, text: string, y: number, pageWidth: number): void {
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  }

  private splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
    return doc.splitTextToSize(text, maxWidth);
  }

  private formatCurrency(amount: number): string {
    console.log(amount);
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('/', ' ') + ' FCFA';
  }

  /**private formatCurrency(amount: number): string {
  if (isNaN(amount) || amount == null) return '0 FCFA';

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    currencyDisplay: 'code', // ou 'symbol' si tu veux juste FCFA
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('XOF', 'XAF');
}*/

  private getTypePaiementLibelle(type: string): string {
    const types: { [key: string]: string } = {
      'ESPECES': 'Espèces',
      'CARTE_BANCAIRE': 'Carte bancaire',
      'VIREMENT': 'Virement',
      'CHEQUE': 'Chèque',
      'MOBILE_MONEY': 'Mobile Money',
      'ORANGE_MONEY': 'Orange Money'
    };
    return types[type] || type;
  }

  private attendre(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
