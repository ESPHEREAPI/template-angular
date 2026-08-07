import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { DevisService } from '../../service/devis.service';
import { ClientService } from '../../service/client.service';
import { ProduitService } from '../../service/produit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, firstValueFrom, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';
import { Produit } from '../../model/produit';
import { Client } from '../../model/client';
import { Devis } from '../../model/devis';


type TypeRemise = 'POURCENTAGE' | 'MONTANT';

interface DevisItem {
  id?: number;
  produitId?: number;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  typeRemise: TypeRemise;
  totalLigne: number;
  searchTerm?: string;
  showDropdown?: boolean;
  filteredProduits?: Produit[];
}

@Component({
  selector: 'app-devis-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './devis-form.component.html',
  styleUrl: './devis-form.component.css'
})
export class DevisFormComponent implements OnInit, OnDestroy {
  devisForm!: FormGroup;
  
  // 🔄 OPTIMISATION: Chargement lazy des clients
  clients: Client[] = [];
  clientsLoading = false;
  clientSearchTerm = '';
  private clientSearchSubject = new Subject<string>();
  
  // 🔄 OPTIMISATION: Produits chargés à la demande
  produits: Produit[] = [];
  produitsCache = new Map<number, Produit>(); // Cache des produits chargés
  
  items: DevisItem[] = [];
  totalDevis: number = 0;
  chargement = false;
  chargementInitial = true;
  username!: string;
  devis!: Devis;
  boutiqueid!: number;
  anneeid!: number;
  remisetotal!: number;

  // Options TVA
  appliquerTVA: boolean = true;
  tauxTVA: number = 19.25;

  // Mode du formulaire
  modeAffichage: 'creation' | 'edition' | 'detail' = 'creation';
  devisId?: number;
  lectureSeule = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private devisService: DevisService,
    private clientService: ClientService,
    private produitService: ProduitService,
    public router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private autheService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    console.log('🚀 Initialisation DevisFormComponent');

    // Charger les informations utilisateur
    const user = this.autheService.getUserFromStorage();
    if (user) {
      this.username = user.usersDTO.userName;
      this.boutiqueid = user.usersDTO.boutiqueid ?? 0;
      this.anneeid = user.anneeid ?? 0;
    }

    // 🚀 OPTIMISATION: Setup recherche clients avec debounce
    this.setupClientSearch();

    // 🚀 OPTIMISATION: Charger seulement les données essentielles
    this.chargerDonneesInitialesOptimisees();

    // Observer les changements de formulaire
    this.devisForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerTotal();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🚀 OPTIMISATION: Configuration recherche clients avec debounce
   */
  private setupClientSearch(): void {
    this.clientSearchSubject
      .pipe(
        debounceTime(300), // Attendre 300ms après la dernière frappe
        distinctUntilChanged(), // Ignorer si même valeur
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.rechercherClients(term);
      });
  }

  /**
   * 🚀 OPTIMISATION: Recherche clients à la demande
   */
  private rechercherClients(term: string): void {
    if (!term || term.length < 2) {
      this.clients = [];
      return;
    }

    this.clientsLoading = true;

    this.clientService.searchClients(term)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          this.clients = clients;
          this.clientsLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Erreur recherche clients:', err);
          this.clientsLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * 🚀 OPTIMISATION: Chargement minimal au démarrage
   */
  private chargerDonneesInitialesOptimisees(): void {
    this.chargementInitial = true;

    // En mode création : charger seulement quelques clients actifs
    if (!this.activatedRoute.snapshot.params['id']) {
      this.chargerClientsActifs();
      this.verifierParametresRoute();
    } else {
      // En mode édition/détail : charger d'abord le devis
      this.verifierParametresRoute();
    }
  }

  /**
   * 🚀 OPTIMISATION: Charger seulement les clients actifs (top 50)
   */
  private chargerClientsActifs(): void {
    this.clientService.findAllActifs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          this.clients = clients.slice(0, 50); // Limiter à 50 premiers
          console.log('✓ Clients actifs chargés:', this.clients.length);
          this.chargementInitial = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Erreur chargement clients:', err);
          this.toastr.error('Erreur lors du chargement des clients');
          this.chargementInitial = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * VÉRIFIER LES PARAMÈTRES DE ROUTE
   */
  private verifierParametresRoute(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      const action = this.activatedRoute.snapshot.url[this.activatedRoute.snapshot.url.length - 1]?.path;

      console.log('🔍 Paramètres route - ID:', id, 'Action:', action);

      if (id && !isNaN(Number(id))) {
        this.devisId = Number(id);

        if (action === 'detail') {
          this.modeAffichage = 'detail';
          this.lectureSeule = true;
        } else if (action === 'edit') {
          this.modeAffichage = 'edition';
          this.lectureSeule = false;
        }

        this.chargerDevis(this.devisId);
      } else {
        this.modeAffichage = 'creation';
        this.lectureSeule = false;
        this.ajouterLigne();
        this.chargementInitial = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * CHARGER UN DEVIS EXISTANT
   */
  private async chargerDevis(id: number): Promise<void> {
    console.log('📥 Chargement du devis', id);
    this.chargement = true;

    try {
      const devis = await firstValueFrom(
        this.devisService.findById(id).pipe(takeUntil(this.destroy$))
      );

      if (!devis) {
        throw new Error('Devis introuvable');
      }

      console.log('✓ Devis chargé:', devis);
      this.devis = devis;

      // Remplir le formulaire
      this.remplirFormulaire(devis);

      // 🚀 OPTIMISATION: Charger le client du devis
      if (devis.client) {
        this.clients = [devis.client];
      }

      // Charger les items
      await this.chargerItemsDevisOptimise(devis);

      if (this.lectureSeule) {
        this.devisForm.disable();
      } else {
        this.devisForm.enable();
      }

      this.toastr.success(
        this.lectureSeule ? 'Devis chargé' : 'Devis chargé - Mode édition',
        'Succès'
      );

    } catch (err) {
      console.error('❌ Erreur chargement devis:', err);
      this.toastr.error('Impossible de charger le devis', 'Erreur');
      this.router.navigate(['/devis']);
    } finally {
      this.chargement = false;
      this.chargementInitial = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * REMPLIR LE FORMULAIRE
   */
  private remplirFormulaire(devis: Devis): void {
    this.devisForm.patchValue({
      clientId: devis.client || '',
      validiteJours: devis.validiteJours || 30,
      remarques: devis.remarques || '',
      dateCible: devis.dateDevis ? new Date(devis.dateDevis).toISOString().split('T')[0] : ''
    });
    this.devisForm.get('clientId')?.setValue(devis.client);
    
    this.appliquerTVA = devis.appliquerTVA ?? true;
    this.tauxTVA = devis.tauxTVA ?? 19.25;
  }

  /**
   * 🚀 OPTIMISATION: Charger les items avec cache des produits
   */
  private async chargerItemsDevisOptimise(devis: Devis): Promise<void> {
    console.log('📦 Chargement optimisé des items');

    if (!devis.items || devis.items.length === 0) {
      if (!this.lectureSeule) {
        this.ajouterLigne();
      }
      return;
    }

    this.items = [];

    // 🚀 Charger tous les produits en une seule requête
    const produitIds = devis.items
      .map(item => item.produitId)
      .filter(id => id !== null && id !== undefined) as number[];

    if (produitIds.length > 0) {
      await this.chargerProduitsBatch(produitIds);
    }

    // Créer les items
    for (const item of devis.items) {
      let produitLibelle = 'Produit inconnu';

      if (item.produitId && this.produitsCache.has(item.produitId)) {
        const produit = this.produitsCache.get(item.produitId)!;
        produitLibelle = produit.reference
          ? `${produit.reference} - ${produit.libelle}`
          : produit.libelle || 'Produit inconnu';
      }

      const devisItem: DevisItem = {
        id: item.id,
        produitId: item.produitId,
        produit: produitLibelle,
        quantite: item.quantite || 1,
        prixUnitaire: item.prixUnitaire || 0,
        remise: item.remise || 0,
        typeRemise: 'MONTANT',
        totalLigne: 0,
        searchTerm: produitLibelle,
        showDropdown: false,
        filteredProduits: []
      };

      devisItem.totalLigne = this.calculerTotalLigne(devisItem);
      this.items.push(devisItem);
    }

    console.log(`✓ ${this.items.length} items chargés`);
    this.calculerTotal();
  }

  /**
   * 🚀 OPTIMISATION: Charger plusieurs produits en une fois et les mettre en cache
   */
  private async chargerProduitsBatch(produitIds: number[]): Promise<void> {
    try {
      // Filtrer les IDs déjà en cache
      const idsACharger = produitIds.filter(id => !this.produitsCache.has(id));

      if (idsACharger.length === 0) {
        return;
      }

      console.log(`📦 Chargement de ${idsACharger.length} produits...`);

      // Charger tous les produits avec stock
      const produits = await firstValueFrom(
        this.produitService.getProduitsHaveStock(this.anneeid, this.boutiqueid)
          .pipe(takeUntil(this.destroy$))
      );

      // Mettre en cache uniquement les produits demandés
      produits
        .filter(p => idsACharger.includes(p.id!))
        .forEach(p => {
          if (p.id) {
            this.produitsCache.set(p.id, p);
          }
        });

      console.log(`✓ ${this.produitsCache.size} produits en cache`);

    } catch (err) {
      console.error('❌ Erreur chargement produits batch:', err);
    }
  }

  /**
   * CALCULER LE TOTAL D'UNE LIGNE
   */
  private calculerTotalLigne(item: DevisItem): number {
    let total = item.quantite * item.prixUnitaire;

    if (item.remise > 0) {
      if (item.typeRemise === 'POURCENTAGE') {
        total = total * (1 - item.remise / 100);
      } else {
        total = total - item.remise;
      }
    }

    return Math.max(0, total);
  }

  private initForm(): void {
    this.devisForm = this.fb.group({
      clientId: ['', Validators.required],
      validiteJours: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      remarques: ['', [Validators.maxLength(500)]],
      dateCible: ['']
    });
  }

  /**
   * AJOUTER UNE LIGNE D'ARTICLE
   */
  ajouterLigne(): void {
    const newItem: DevisItem = {
      produit: '',
      quantite: 1,
      prixUnitaire: 0,
      remise: 0,
      typeRemise: 'POURCENTAGE',
      totalLigne: 0,
      searchTerm: '',
      showDropdown: false,
      filteredProduits: []
    };
    this.items.push(newItem);
    this.calculerTotal();
  }

  /**
   * SUPPRIMER UNE LIGNE
   */
  supprimerLigne(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
      this.calculerTotal();
    } else {
      this.toastr.warning('Au moins une ligne est requise', 'Attention');
    }
  }

  /**
   * CALCULER LE TOTAL GLOBAL
   */
  calculerTotal(): void {
    this.items.forEach(item => {
      item.totalLigne = this.calculerTotalLigne(item);
    });

    const totalHT = this.items.reduce((sum, item) => sum + item.totalLigne, 0);

    if (this.appliquerTVA) {
      this.totalDevis = totalHT * (1 + this.tauxTVA / 100);
    } else {
      this.totalDevis = totalHT;
    }

    this.remisetotal = this.items.reduce(
      (sum, item) =>
        sum +
        (item.typeRemise === 'POURCENTAGE'
          ? this.calculRemisPourcentage(item.remise, (item.prixUnitaire * item.quantite))
          : item.remise),
      0
    );

    this.cdr.markForCheck();
  }

  toggleTVA(): void {
    this.calculerTotal();
  }

  calculRemisPourcentage(tauxtva: number, prix: number): number {
    let mnttva = (prix * tauxtva / 100);
    return Math.max(0, mnttva);
  }

  getDateExpiration(): Date {
    const validite = this.devisForm.get('validiteJours')?.value || 30;
    const dateExp = new Date();
    dateExp.setDate(dateExp.getDate() + validite);
    return dateExp;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.devisForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * 🚀 OPTIMISATION: Recherche produits avec chargement à la demande
   */
  async onSearchProduit(index: number, term: string): Promise<void> {
    const item = this.items[index];
    item.searchTerm = term;

    if (term.length < 2) {
      item.showDropdown = false;
      return;
    }

    // Si produits pas encore chargés, les charger maintenant
    if (this.produits.length === 0) {
      try {
        this.produits = await firstValueFrom(
          this.produitService.getProduitsHaveStock(this.anneeid, this.boutiqueid)
            .pipe(takeUntil(this.destroy$))
        );
        
        // Mettre en cache
        this.produits.forEach(p => {
          if (p.id) {
            this.produitsCache.set(p.id, p);
          }
        });

        console.log('✓ Produits chargés pour recherche:', this.produits.length);
      } catch (err) {
        console.error('❌ Erreur chargement produits:', err);
        return;
      }
    }

    // Filtrer localement
    item.filteredProduits = this.produits.filter(p =>
      p.libelle?.toLowerCase().includes(term.toLowerCase()) ||
      p.reference?.toLowerCase().includes(term.toLowerCase())
    );
    
    item.showDropdown = item.filteredProduits.length > 0;
    this.cdr.markForCheck();
  }

  /**
   * SÉLECTIONNER UN PRODUIT
   */
  selectionnerProduit(index: number, produit: Produit): void {
    const item = this.items[index];
    item.produitId = produit.id;
    item.produit = produit.reference
      ? `${produit.reference} - ${produit.libelle}`
      : produit.libelle || '';
    item.searchTerm = item.produit;
    item.prixUnitaire = produit.prixVenteNet || 0;
    item.showDropdown = false;

    // Mettre en cache
    if (produit.id) {
      this.produitsCache.set(produit.id, produit);
    }

    this.calculerTotal();
  }

  /**
   * 🚀 Handler pour la recherche de client
   */
  onClientSearch(term: string): void {
    this.clientSearchTerm = term;
    this.clientSearchSubject.next(term);
  }

  /**
   * SAUVEGARDER LE DEVIS
   */
  async sauvegarder(): Promise<void> {
    if (this.devisForm.invalid) {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires', 'Formulaire invalide');
      Object.keys(this.devisForm.controls).forEach(key => {
        this.devisForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.items.length === 0 || !this.items.some(i => i.produitId)) {
      this.toastr.warning('Veuillez ajouter au moins un article', 'Articles manquants');
      return;
    }

    console.log('💾 Sauvegarde du devis');
    this.chargement = true;

    try {
      const devisData = this.preparerDonneesDevis();

      let response;
      if (this.modeAffichage === 'edition' && this.devisId) {
        response = await firstValueFrom(
          this.devisService.updateDevis(this.devisId, devisData, this.username)
            .pipe(takeUntil(this.destroy$))
        );
        this.toastr.success('Devis mis à jour avec succès', 'Succès');
      } else {
        response = await firstValueFrom(
          this.devisService.creerDevis(devisData, this.username)
            .pipe(takeUntil(this.destroy$))
        );
        this.toastr.success('Devis créé avec succès', 'Succès');
      }

      console.log('✓ Devis sauvegardé:', response);

      setTimeout(() => {
        this.router.navigate(['/devis']);
      }, 1000);

    } catch (err: any) {
      console.error('❌ Erreur sauvegarde:', err);
      const message = err?.error?.message || 'Erreur lors de la sauvegarde';
      this.toastr.error(message, 'Erreur');
    } finally {
      this.chargement = false;
      this.cdr.markForCheck();
    }
  }

  private preparerDonneesDevis(): any {
    const formValue = this.devisForm.value;

    return {
      client: this.devisForm.get('clientId')?.value,
      validiteJours: formValue.validiteJours,
      remarques: formValue.remarques,
      dateDevis: formValue.dateCible || new Date().toISOString().split('T')[0],
      appliquerTVA: this.appliquerTVA,
      tauxTVA: this.tauxTVA,
      items: this.items
        .filter(item => item.produitId)
        .map(item => ({
          id: item.id ?? null,
          produitId: item.produitId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          montantRemise: item.remise,
          typeRemise: item.typeRemise,
          tauxRemise: item.typeRemise == 'POURCENTAGE' ? item.remise : null,
        })),
      username: this.username,
      boutiqueid: this.boutiqueid,
      anneeid: this.anneeid,
      montantHT: Math.round((this.totalDevis / (this.appliquerTVA ? (1 + this.tauxTVA / 100) : 1))),
      total: Math.round(this.totalDevis),
      totalTVA: Math.round((this.totalDevis - (this.totalDevis / (1 + this.tauxTVA / 100)))),
      totalRemise: this.remisetotal,
 
    };
  }

  annuler(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.')) {
      this.router.navigate(['/devis']);
    }
  }

  getTitre(): string {
    switch (this.modeAffichage) {
      case 'creation':
        return 'Créer un Devis';
      case 'edition':
        return `Modifier le Devis #${this.devisId}`;
      case 'detail':
        return `Détails du Devis #${this.devisId}`;
      default:
        return 'Devis';
    }
  }
}