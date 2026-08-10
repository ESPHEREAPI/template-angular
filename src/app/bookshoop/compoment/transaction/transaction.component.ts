import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { Depot } from '../../model/depot';
import { TransfertResponse } from '../../model/TransfertResponse';
import { TransfertRequest } from '../../model/TransfertRequest';
import { StockService } from '../../service/StockService';
import { ReferenceDataService } from '../../service/reference-data.service';
import { AuthService } from '../../../auth/auth.service';

/**
 * Interface pour les produits avec stock
 */
interface ProduitAvecStock {
  id: number;
  code: string;
  libelle: string;
  reference: string;
  stockDisponible: number;
  prixAchat?: number;
  prixVente?: number;
  typeDepot: 'MAGASIN' | 'POINT_VENTE';
}

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.css'
})
export class TransactionComponent implements OnInit, OnDestroy {
  formulaire: FormGroup;
  
  // Données
  magasins: Depot[] = [];
  produitsDisponibles: ProduitAvecStock[] = [];

  // Stocks affichés dynamiquement
  stockSource: number = 0;
  stockDestination: number = 0;
  stockDisponible: boolean = false;

  // États de chargement
  chargementMagasins: boolean = false;
  chargementProduits: boolean = false;
  soumission: boolean = false;

  // Messages
  erreur: string = '';
  succes: string = '';
  reponseTransfert: TransfertResponse | null = null;

  // Infos utilisateur
  boutiqueid!: number;
  anneeid!: number;
  username!: string;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private referenceDataService: ReferenceDataService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.formulaire = this.fb.group({
      magasinSourceId: ['', Validators.required],
      produitId: ['', Validators.required],
      magasinDestinationId: ['', Validators.required],
      quantite: ['', [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });

    // Désactiver les champs dépendants au démarrage
    this.formulaire.get('produitId')?.disable();
    this.formulaire.get('magasinDestinationId')?.disable();
    this.formulaire.get('quantite')?.disable();
  }

  ngOnInit(): void {
    // Charger les informations utilisateur
    const user = this.authService.getUserFromStorage();
    if (user) {
      this.username = user.usersDTO.userName;
      this.boutiqueid = user.usersDTO.boutiqueid ?? 0;
      this.anneeid = user.anneeid ?? 0;
    }

    // Charger uniquement les dépôts au démarrage
    this.chargerMagasins();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ÉTAPE 1: Charger uniquement les dépôts/magasins
   */
  chargerMagasins(): void {
    this.chargementMagasins = true;
    
    // Depots ET points de vente : les 4 combinaisons (Magasin<->Magasin,
    // Magasin<->Point de vente, Point de vente<->Point de vente) sont
    // valides pour un transfert (voir "Guide d'utilisation" de l'ecran) -
    // getDepotsMagasin() se limitait aux depots purs et masquait donc a
    // la fois les points de vente et tout magasin cree avec une boutique
    // rattachee.
    this.referenceDataService.getTousLesMagasins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.magasins = data;
          console.log('✅ Magasins chargés:', this.magasins.length);
          this.chargementMagasins = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Erreur chargement magasins:', err);
          this.toastr.error('Erreur lors du chargement des dépôts');
          this.chargementMagasins = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * ÉTAPE 2: Quand le dépôt source est sélectionné
   * Charger UNIQUEMENT les produits de ce dépôt avec leur stock
   */
  onMagasinSourceChange(): void {
    const magasinSourceId = this.formulaire.get('magasinSourceId')?.value;
    
    // Réinitialiser les champs dépendants
    this.formulaire.patchValue({
      produitId: '',
      magasinDestinationId: '',
      quantite: ''
    });
    this.produitsDisponibles = [];
    this.stockSource = 0;
    this.stockDestination = 0;
    this.stockDisponible = false;

    if (!magasinSourceId) {
      this.formulaire.get('produitId')?.disable();
      this.formulaire.get('magasinDestinationId')?.disable();
      this.formulaire.get('quantite')?.disable();
      return;
    }

    // Charger les produits disponibles dans ce dépôt
    this.chargerProduitsParDepot(magasinSourceId);
  }

  /**
   * Charge les produits disponibles dans un dépôt spécifique
   * OPTIMISÉ: Une seule requête backend qui retourne produits + stocks
   */
  chargerProduitsParDepot(depotId: number): void {
    this.chargementProduits = true;
    console.log('🔄 Chargement des produits pour le dépôt:', depotId);

    this.stockService.getProduitsDisponiblesParDepot(depotId, this.anneeid, this.boutiqueid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produits: ProduitAvecStock[]) => {
          this.produitsDisponibles = produits;
          console.log('✅ Produits chargés:', this.produitsDisponibles.length);
          
          // Activer le champ produit
          this.formulaire.get('produitId')?.enable();
          this.chargementProduits = false;

          if (this.produitsDisponibles.length === 0) {
            this.toastr.warning('Aucun produit en stock dans ce dépôt');
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Erreur chargement produits:', err);
          this.toastr.error('Erreur lors du chargement des produits');
          this.chargementProduits = false;
          this.produitsDisponibles = [];
          this.formulaire.get('produitId')?.disable();
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * ÉTAPE 3: Quand le produit est sélectionné
   * Récupérer son stock depuis la liste déjà chargée
   */
  onProduitChange(): void {
    const produitId = this.formulaire.get('produitId')?.value;
    
    // Réinitialiser
    this.formulaire.patchValue({
      magasinDestinationId: '',
      quantite: ''
    });
    this.stockDestination = 0;
    this.stockDisponible = false;

    if (!produitId) {
      this.formulaire.get('magasinDestinationId')?.disable();
      this.formulaire.get('quantite')?.disable();
      return;
    }

    // Récupérer le stock depuis les produits déjà chargés
    const produitSelectionne = this.produitsDisponibles.find(p => p.id === +produitId);
    if (produitSelectionne) {
      this.stockSource = produitSelectionne.stockDisponible;
      console.log('📊 Stock source:', this.stockSource);
    }

    // Activer les champs suivants
    this.formulaire.get('magasinDestinationId')?.enable();
    this.formulaire.get('quantite')?.enable();
    
    this.cdr.markForCheck();
  }

  /**
   * ÉTAPE 4: Quand le dépôt destination est sélectionné
   * Récupérer le stock de ce produit dans ce dépôt
   */
  onMagasinDestinationChange(): void {
    const produitId = this.formulaire.get('produitId')?.value;
    const magasinDestId = this.formulaire.get('magasinDestinationId')?.value;

    if (!produitId || !magasinDestId) {
      this.stockDestination = 0;
      return;
    }

    // Vérifier que source != destination
    const magasinSourceId = this.formulaire.get('magasinSourceId')?.value;
    if (magasinSourceId === magasinDestId) {
      this.erreur = 'Le dépôt source et destination doivent être différents';
      this.formulaire.patchValue({ magasinDestinationId: '' });
      return;
    }

    this.erreur = '';

    // Récupérer le stock destination
    this.stockService.obtenirStock(magasinDestId, produitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.stockDestination = data.quantite || 0;
          console.log('📊 Stock destination:', this.stockDestination);
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('❌ Erreur stock destination:', error);
          this.stockDestination = 0;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * ÉTAPE 5: Vérifier la disponibilité quand la quantité change
   */
  onQuantiteChange(): void {
    const quantite = parseFloat(this.formulaire.get('quantite')?.value || '0');
    this.stockDisponible = quantite > 0 && quantite <= this.stockSource;
    
    if (quantite > this.stockSource) {
      this.erreur = `Quantité indisponible ! Stock disponible: ${this.stockSource.toFixed(2)} unités`;
    } else {
      this.erreur = '';
    }
  }

  /**
   * Soumet le formulaire de transfert
   */
  soumettre(): void {
    if (!this.formulaire.valid) {
      this.erreur = 'Veuillez remplir tous les champs requis';
      return;
    }

    if (!this.stockDisponible) {
      this.erreur = 'La quantité demandée dépasse le stock disponible';
      return;
    }

    this.soumission = true;
    this.erreur = '';
    this.succes = '';

    const requete: TransfertRequest = {
      produitId: this.formulaire.get('produitId')?.value,
      magasinSourceId: this.formulaire.get('magasinSourceId')?.value,
      magasinDestinationId: this.formulaire.get('magasinDestinationId')?.value,
      quantite: this.formulaire.get('quantite')?.value,
      notes: this.formulaire.get('notes')?.value,
      username: this.username
    };

    console.log('📤 Envoi du transfert:', requete);

    this.stockService.effectuerTransfert(requete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reponse: TransfertResponse) => {
          this.soumission = false;
          this.reponseTransfert = reponse;
          this.succes = 'Transfert effectué avec succès!';
          this.toastr.success('Transfert effectué avec succès!');

          console.log('✅ Transfert réussi:', reponse);

          // Réinitialiser après 3 secondes
          setTimeout(() => {
            this.reinitialiser();
          }, 3000);
        },
        error: (error: any) => {
          this.soumission = false;
          console.error('❌ Erreur transfert:', error);

          if (error.error && error.error.error) {
            this.erreur = error.error.error;
          } else {
            this.erreur = 'Une erreur s\'est produite lors du transfert';
          }
          
          this.toastr.error(this.erreur);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Réinitialise le formulaire
   */
  reinitialiser(): void {
    this.formulaire.reset();
    this.produitsDisponibles = [];
    this.stockSource = 0;
    this.stockDestination = 0;
    this.stockDisponible = false;
    this.erreur = '';
    this.succes = '';
    this.reponseTransfert = null;

    // Désactiver les champs dépendants
    this.formulaire.get('produitId')?.disable();
    this.formulaire.get('magasinDestinationId')?.disable();
    this.formulaire.get('quantite')?.disable();
  }

  /**
   * Récupère le libellé du dépôt
   */
  obtenirLibelleMagasin(id: number): string {
    const magasin = this.magasins.find(m => m.id === id);
    return magasin ? magasin.libelle : '';
  }

  /**
   * Récupère le type du dépôt
   */
  obtenirTypeMagasin(id: number): string {
    const magasin = this.magasins.find(m => m.id === id);
    return magasin ? (magasin.boutique === null ? 'Magasin de stock' : 'Point de vente') : '';
  }

  /**
   * Récupère le libellé du produit
   */
  obtenirLibelleProduit(id: number): string {
    const produit = this.produitsDisponibles.find(p => p.id === id);
    return produit ? produit.libelle : '';
  }

  /**
   * Getter pour vérifier si le chargement est en cours
   */
  get estEnChargement(): boolean {
    return this.chargementMagasins || this.chargementProduits;
  }
}