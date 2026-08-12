// src/app/features/factures/pages/facture-form/facture-form.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Client } from '../../model/client';
import { Produit } from '../../model/produit';
import { FactureService } from '../../service/facture.service';
import { Facture } from '../../model/facture';
import { FactureItemRequest } from '../../model/FactureItemRequest';
import { FactureUpdateRequest } from '../../model/FactureUpdateRequest';
import { FactureCreateRequest } from '../../model/FactureCreateRequest';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../service/client.service';
import { AuthService } from '../../../auth/auth.service';
import { ProduitService } from '../../service/produit.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-facture-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './facture-form.component.html',
  styleUrls: ['./facture-form.component.css']
})
export class FactureFormComponent implements OnInit, OnDestroy {
  factureForm!: FormGroup;
  isEditMode = false;
  factureId?: number;
  loading = false;
  submitting = false;
  
  // Données
  clients: Client[] = [];
  produits: Produit[] = [];
  username!: string;
  boutiqueid!: number;
  anneeid!: number;
  
  // Recherche Client
  clientSearchTerm: string = '';
  filteredClients: Client[] = [];
  selectedClient: Client | null = null;
  showClientDropdown: boolean = false;
  
  // Recherche Produits (pour chaque ligne)
  produitSearchTerms: { [key: number]: string } = {};
  filteredProduitsArray: { [key: number]: Produit[] } = {};
  selectedProduits: { [key: number]: Produit } = {};
  showProduitDropdown: { [key: number]: boolean } = {};
  
  // Calculs
  totalHT = 0;
  totalTVA = 0;
  totalTTC = 0;
  totalRemise = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private factureService: FactureService,
    private route: ActivatedRoute,
    private router: Router,
    private clientservice: ClientService,
    private autheService: AuthService,
    private produitService: ProduitService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Charger les informations utilisateur
    const user = this.autheService.getUserFromStorage();
    if (user) {
      this.username = user.usersDTO.userName;
      this.boutiqueid = user.usersDTO.boutiqueid ?? 0;
      this.anneeid = user.anneeid ?? 0;
    }

    this.initForm();
    this.checkEditMode();
    this.loadData();
    
    // Écoute les changements pour recalculer les totaux
    this.items.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculerTotaux());
    
    // Fermer les dropdowns quand on clique ailleurs
    document.addEventListener('click', this.closeDropdowns.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.closeDropdowns.bind(this));
  }

  /**
   * Ferme tous les dropdowns
   */
  closeDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.input-group') && !target.closest('.list-group')) {
      this.showClientDropdown = false;
      Object.keys(this.showProduitDropdown).forEach(key => {
        this.showProduitDropdown[+key] = false;
      });
    }
  }

  /**
   * Initialise le formulaire
   */
  initForm(): void {
    const today = new Date().toISOString().substring(0, 10);
    const echeance = new Date();
    echeance.setDate(echeance.getDate() + 30);
    const echeanceStr = echeance.toISOString().substring(0, 10);

    this.factureForm = this.fb.group({
      clientId: [null, Validators.required],
      dateFacture: [today, Validators.required],
      dateEcheance: [echeanceStr, Validators.required],
      delaiPaiement: [30],
      conditionsPaiement: [''],
      remarques: [''],
      tauxRemiseGlobale: [0],
      accompte: [0],
      items: this.fb.array([])
    });
  }

  /**
   * Charge toutes les données nécessaires
   */
  loadData(): void {
    this.loading = true;
    forkJoin({
      clients: this.clientservice.listClients(),
      produits: this.produitService.getProduitsHaveStock(this.anneeid, this.boutiqueid)
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clients = data.clients || [];
          this.produits = (data.produits || []).filter(p => p.libelle && p.libelle.trim() !== '');
          
          // Initialiser la liste filtrée des clients
          this.filteredClients = [...this.clients];
          
          console.log('✓ Clients chargés:', this.clients.length);
          console.log('✓ Produits chargés:', this.produits.length);
          
          this.loading = false;
          this.toastr.success('Données chargées avec succès');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Erreur chargement données:', err);
          this.toastr.error('Erreur lors du chargement des données');
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Filtre les clients selon le terme de recherche
   */
  filterClients(): void {
    const term = this.clientSearchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredClients = [...this.clients];
    } else {
      this.filteredClients = this.clients.filter(client => 
        (client.code?.toLowerCase().includes(term) || false) ||
        (client.nom?.toLowerCase().includes(term) || false) ||
        (client.telephone?.toLowerCase().includes(term) || false)
      );
    }
    
    this.showClientDropdown = true;
  }

  /**
   * Sélectionne un client
   */
  selectClient(client: Client): void {
    this.selectedClient = client;
    this.clientSearchTerm = `${client.code} - ${client.nom}`;
    this.factureForm.patchValue({ clientId: client.id });
    this.showClientDropdown = false;
    this.toastr.success(`Client "${client.nom}" sélectionné`);
  }

  /**
   * Efface le client sélectionné
   */
  clearClient(): void {
    this.selectedClient = null;
    this.clientSearchTerm = '';
    this.factureForm.patchValue({ clientId: null });
    this.filteredClients = [...this.clients];
  }

  /**
   * Recherche de produit pour une ligne donnée
   */
  onProduitSearch(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const term = target.value.toLowerCase().trim();
    
    this.produitSearchTerms[index] = target.value;
    
    if (!term) {
      this.filteredProduitsArray[index] = [...this.produits];
    } else {
      this.filteredProduitsArray[index] = this.produits.filter(produit => 
        (produit.reference?.toLowerCase().includes(term) || false) ||
        (produit.libelle?.toLowerCase().includes(term) || false) ||
        (produit.barcode?.toLowerCase().includes(term) || false)
      );
    }
    
    this.showProduitDropdown[index] = true;
  }

  /**
   * Sélectionne un produit pour une ligne donnée
   */
  selectProduit(index: number, produit: Produit): void {
    this.selectedProduits[index] = produit;
    this.produitSearchTerms[index] = `${produit.reference} - ${produit.libelle}`;
    this.showProduitDropdown[index] = false;
    
    // Remplir automatiquement les champs
    const item = this.items.at(index);
    item.patchValue({
      produitId: produit.id,
      // getProduitsHaveStock (recherche d'article) alimente le champ
      // prixVente (pas prixVenteNet, toujours vide sur cette reponse - voir
      // PointVenteRepositories.findProduitsDtoByAnneeAndBoutique qui mappe
      // PrixArticles.prixVenteNet dans le champ DTO nomme prixVente).
      prixUnitaireHT: produit.prixVente || 0,
      tauxTVA: produit.tva || 19.25,
      quantite: 1
    });
    
    this.calculerTotaux();
    this.toastr.success(`Produit "${produit.libelle}" ajouté`);
  }

  /**
   * Calcule le total d'une ligne
   */
  calculateItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantite = item.get('quantite')?.value || 0;
    const prixUnitaireHT = item.get('prixUnitaireHT')?.value || 0;
    const tauxRemise = item.get('tauxRemise')?.value || 0;
    
    const montantBrut = quantite * prixUnitaireHT;
    const montantRemise = montantBrut * (tauxRemise / 100);
    return montantBrut - montantRemise;
  }

  /**
   * Vérifie si on est en mode édition
   */
  checkEditMode(): void {
    this.factureId = this.route.snapshot.params['id'];
    if (this.factureId) {
      this.isEditMode = true;
      this.loadFacture(this.factureId);
    } else {
      // Ajoute une première ligne vide
      this.addItem();
    }
  }

  /**
   * Charge une facture existante
   */
  loadFacture(id: number): void {
    this.loading = true;
    this.factureService.getFacture(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facture: Facture) => {
          this.patchFactureForm(facture);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.toastr.error('Erreur lors du chargement de la facture');
          this.router.navigate(['/factures']);
        }
      });
  }

  /**
   * Remplit le formulaire avec les données de la facture
   */
  patchFactureForm(facture: Facture): void {
    console.log("facture pour update", facture);

    const formatDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      return d.toISOString().substring(0, 10);
    };

    this.factureForm.patchValue({
      clientId: facture.client?.id,
      dateFacture: formatDate(facture.dateFacture),
      dateEcheance: formatDate(facture.dateEcheance),
      delaiPaiement: facture.delaiPaiement,
      conditionsPaiement: facture.conditionsPaiement,
      remarques: facture.remarques,
      tauxRemiseGlobale: facture.tauxRemiseGlobale || 0,
      accompte: facture.accompte || 0
    });

    // Sélectionner le client
    if (facture.client) {
      this.selectedClient = facture.client;
      this.clientSearchTerm = `${facture.client.code} - ${facture.client.nom}`;
    }

    // Charge les items
    facture.items.forEach((item, index) => {
      this.items.push(this.createItem(item));
      
      // Sélectionner le produit pour chaque ligne
      if (item.produit) {
        this.selectedProduits[index] = item.produit;
        this.produitSearchTerms[index] = `${item.produit.reference} - ${item.produit.libelle}`;
      }
    });

    this.calculerTotaux();
  }

  /**
   * Getter pour les items du formulaire
   */
  get items(): FormArray {
    return this.factureForm.get('items') as FormArray;
  }

  /**
   * Crée un nouvel item de formulaire
   */
  createItem(item?: any): FormGroup {
    return this.fb.group({
      produitId: [item?.produit?.id || null, Validators.required],
      quantite: [item?.quantite || 1, [Validators.required, Validators.min(1)]],
      prixUnitaireHT: [item?.prixUnitaireHT || 0, [Validators.required, Validators.min(0)]],
      tauxTVA: [item?.tauxTVA || 19.25, [Validators.required, Validators.min(0)]],
      tauxRemise: [item?.tauxRemise || 0, [Validators.min(0), Validators.max(100)]],
      typeRemise: [item?.typeRemise || 'POURCENTAGE'],
      commentaire: [item?.commentaire || '']
    });
  }

  /**
   * Ajoute un nouvel item
   */
  addItem(): void {
    const newIndex = this.items.length;
    this.items.push(this.createItem());
    this.filteredProduitsArray[newIndex] = [...this.produits];
    this.showProduitDropdown[newIndex] = false;
  }

  /**
   * Supprime un item
   */
  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      delete this.selectedProduits[index];
      delete this.produitSearchTerms[index];
      delete this.filteredProduitsArray[index];
      delete this.showProduitDropdown[index];
      this.calculerTotaux();
      this.toastr.info('Article supprimé');
    }
  }

  /**
   * Calcule les totaux de la facture
   */
  calculerTotaux(): void {
    let totalHT = 0;
    let totalTVA = 0;
    let totalRemise = 0;

    this.items.controls.forEach(item => {
      const quantite = item.get('quantite')?.value || 0;
      const prixUnitaireHT = item.get('prixUnitaireHT')?.value || 0;
      const tauxTVA = item.get('tauxTVA')?.value || 0;
      const tauxRemise = item.get('tauxRemise')?.value || 0;
      const typeRemise = item.get('typeRemise')?.value || 'POURCENTAGE';

      // Montant brut
      const montantBrut = quantite * prixUnitaireHT;

      // Calcul remise
      let montantRemise = 0;
      if (typeRemise === 'POURCENTAGE') {
        montantRemise = montantBrut * (tauxRemise / 100);
      } else {
        montantRemise = tauxRemise;
      }

      // Montant HT après remise
      const montantHT = montantBrut - montantRemise;

      // Montant TVA
      const montantTVA = montantHT * (tauxTVA / 100);

      totalHT += montantHT;
      totalTVA += montantTVA;
      totalRemise += montantRemise;
    });

    // Remise globale
    const tauxRemiseGlobale = this.factureForm.get('tauxRemiseGlobale')?.value || 0;
    if (tauxRemiseGlobale > 0) {
      const remiseGlobale = totalHT * (tauxRemiseGlobale / 100);
      totalHT -= remiseGlobale;
      totalRemise += remiseGlobale;
      totalTVA = totalHT * 0.1925; // Recalcul TVA
    }

    this.totalHT = totalHT;
    this.totalTVA = totalTVA;
    this.totalTTC = totalHT + totalTVA;
    this.totalRemise = totalRemise;
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.factureForm.invalid) {
      this.markFormGroupTouched(this.factureForm);
      this.toastr.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier que tous les produits ont un stock suffisant
    let stockInsuffisant = false;
    this.items.controls.forEach((item, index) => {
      const quantite = item.get('quantite')?.value || 0;
      const produit = this.selectedProduits[index];
      if(!produit.stock)return;
      if (produit && quantite > produit?.stock ) {
        stockInsuffisant = true;
        this.toastr.error(`Stock insuffisant pour ${produit.libelle}`);
      }
    });

    if (stockInsuffisant) {
      return;
    }

    this.submitting = true;
    const formValue = this.factureForm.value;

    // Prépare les items
    const items: FactureItemRequest[] = formValue.items.map((item: any) => ({
      produitId: item.produitId,
      quantite: item.quantite,
      prixUnitaireHT: item.prixUnitaireHT,
      tauxTVA: item.tauxTVA,
      tauxRemise: item.tauxRemise,
      typeRemise: item.typeRemise,
      commentaire: item.commentaire
    }));

    if (this.isEditMode && this.factureId) {
      // Mode édition
      const updateRequest: FactureUpdateRequest = {
        id: this.factureId,
        dateFacture: formValue.dateFacture,
        dateEcheance: formValue.dateEcheance,
        conditionsPaiement: formValue.conditionsPaiement,
        remarques: formValue.remarques,
        tauxRemiseGlobale: formValue.tauxRemiseGlobale,
        items: items,
        username: this.username
      };

      this.factureService.modifierFacture(this.factureId, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.submitting = false;
            this.toastr.success('Facture modifiée avec succès');
            this.router.navigate(['/factures', this.factureId]);
          },
          error: (err) => {
            this.submitting = false;
            this.toastr.error('Erreur lors de la modification de la facture');
            console.error(err);
          }
        });
    } else {
      // Mode création
      const createRequest: FactureCreateRequest = {
        clientId: formValue.clientId,
        dateFacture: formValue.dateFacture,
        dateEcheance: formValue.dateEcheance,
        delaiPaiement: formValue.delaiPaiement,
        conditionsPaiement: formValue.conditionsPaiement,
        remarques: formValue.remarques,
        tauxRemiseGlobale: formValue.tauxRemiseGlobale,
        accompte: formValue.accompte,
        items: items,
        username: this.username
      };

      this.factureService.creerFacture(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.submitting = false;
            this.toastr.success('Facture créée avec succès');
            this.router.navigate(['/factures', response.id]);
          },
          error: (err) => {
            this.submitting = false;
            this.toastr.error('Erreur lors de la création de la facture');
            console.error(err);
          }
        });
    }
  }

  /**
   * Annulation
   */
  onCancel(): void {
    if (this.factureId) {
      this.router.navigate(['/factures', this.factureId]);
    } else {
      this.router.navigate(['/factures']);
    }
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  /**
   * Formate un montant
   */
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' XAF';
  }
}