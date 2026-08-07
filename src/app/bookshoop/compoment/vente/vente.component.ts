// src/app/components/vente/vente.component.ts
// ✅ VERSION FINALE ROBUSTE - Mode "Resilient" avec cache-first
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, Subject, takeUntil, catchError, of, timeout, firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

// Imports des services et modèles
import { CaisseItem } from '../../model/caisse-item';
import { Person } from '../../model/person';
import { Produit } from '../../model/produit';
import { Vente } from '../../model/vente';
import { User } from '../../model/user';

import { BarcodeService } from '../../service/barcode.service';
import { NotificationService } from '../../service/notification.service';
import { UserService } from '../../service/user-service.service';
import { PrintService } from '../../service/print.service';
import { StockManagementService } from '../../service/stock-management.service';
import { AuthService } from '../../../auth/auth.service';
import { OfflineSyncService, SyncStatus, VenteOffline } from '../../service/OfflineSyncService';


@Component({
  selector: 'app-vente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vente.component.html',
  styleUrl: './vente.component.css'
})
export class VenteComponent implements OnInit, OnDestroy {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
  private destroy$ = new Subject<void>();

  // ==================== FORMS ====================
  venteForm!: FormGroup;
  articleForm!: FormGroup;
  bonAchatForm!: FormGroup;
  clientForm!: FormGroup;

  // ==================== DATA ====================
  caisseItems: CaisseItem[] = [];
  articles: Produit[] = [];
  filteredArticles: Produit[] = [];
  personnes: Person[] = [];
  typesPaiement: string[] = [
    'ESPECES', 
    'MOBILE_MONEY', 
    'ORANGE_MONEY', 
    'EXPRESS_UNION', 
    'CARTE_BANCAIRE', 
    'VIREMENT', 
    'CHEQUE'
  ];

  // ==================== UI STATE ====================
  loading = false;
  showArticleModal = false;
  showPaiementModal = false;
  showBonAchatModal = false;
  showClientModal = false;
  showConfirmationModal = false;
  showOfflineInfoModal = false;

  // ==================== VENTE DATA ====================
  numeroTicket = '';
  montantTotal = 0;
  montantTotalApaye = 0;
  montantRemise = 0;
  typePaiementSelectionne = 'ESPECES';
  montantRecu = 0;
  monnaieRendue = 0;
  venteValidee!: Vente;
  venteid: number = 0;
  numerocommande: number = 0;
  user: User | null = null;
  userSession: any;

  // ==================== BON D'ACHAT ====================
  bonAchatCode = '';
  bonAchatValide = false;
  montantBonAchat = 0;
  resteApresBonAchat = 0;

  // ==================== OFFLINE STATE ====================
  syncStatus: SyncStatus = {
    isOnline: true,
    backendAvailable: false,
    pendingSales: 0,
    failedSales: 0,
    syncInProgress: false
  };
  isOfflineMode = false;
  canUseCache = false;
  showSyncDetails = false;
  showStatusToast = false;
  private statusToastTimeout: any;

  // ✅ NOUVEAU : Cache des stocks en mémoire
private stocksCache = new Map<number, number>();
private stocksCacheTimestamp: number = 0;
private readonly STOCK_CACHE_DURATION = 30000; // 3

  constructor(
    private fb: FormBuilder,
    private barcodeService: BarcodeService,
    private notificationService: NotificationService,
    private userService: UserService,
    private printService: PrintService,
    private stockManagementService: StockManagementService,
    private authService: AuthService,
    private offlineSyncService: OfflineSyncService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    console.log('🚀 Initialisation composant vente');
    
    // Récupérer l'utilisateur connecté
    this.userSession = this.authService.currentUserValue;
    if (this.userSession && this.userSession.usersDTO) {
      this.user = this.userSession.usersDTO;
      console.log('👤 Utilisateur:', this.user?.userName);
      
      // Configurer le boutiqueid dans le service de synchronisation
      if (this.user?.boutiqueid) {
        this.offlineSyncService.boutiqueid = this.user.boutiqueid;
        console.log('🏪 Boutique ID configuré:', this.user.boutiqueid);
      } else {
        console.warn('⚠️ Aucun boutiqueid trouvé pour l\'utilisateur');
        this.offlineSyncService.boutiqueid = 0;
      }
    }

    this.genererNumeroTicket();
    this.initSyncStatusMonitoring();
    this.initStockMonitoring();
    this.initRemiseMonitoring();
    this.chargerDonneesAvecFallback();
    this.focusBarcodeInput();
  }

  ngOnDestroy(): void {
    console.log('🛑 Destruction composant vente');
    this.destroy$.next();
    this.destroy$.complete();
    this.stockManagementService.destroy();
    if (this.statusToastTimeout) {
      clearTimeout(this.statusToastTimeout);
    }
  }

  // ==================== INITIALISATION ====================
  private initializeForms(): void {
    this.venteForm = this.fb.group({
      barcode: [''],
      client: [''],
      typeRemise: ['taux'],
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

  private initSyncStatusMonitoring(): void {
    this.offlineSyncService.getSyncStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        console.log('📡 Statut sync:', status);
        
        this.syncStatus = status;
        this.isOfflineMode = !status.isOnline || !status.backendAvailable;
        this.canUseCache = true;

        if (!status.isOnline) {
          this.showOfflineNotification('❌ Pas de connexion Internet - Mode offline activé');
        } else if (!status.backendAvailable) {
          this.showOfflineNotification('⚠️ Serveur inaccessible - Mode offline activé');
        } else if (status.pendingSales > 0 && !status.syncInProgress) {
          this.notificationService.info(
            `📤 ${status.pendingSales} vente(s) en attente de synchronisation`
          );
        }
      });
  }

  private showOfflineNotification(message: string): void {
    const alreadyShown = sessionStorage.getItem('offline-notification-shown');
    if (!alreadyShown) {
      this.notificationService.warning(message);
      sessionStorage.setItem('offline-notification-shown', 'true');
      
      if (!this.hasSeenOfflineInfo()) {
        this.showOfflineInfoModal = true;
        this.markOfflineInfoSeen();
      }
    }
  }

  private initStockMonitoring(): void {
    this.stockManagementService.stockAlert$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        alerts.forEach(alert => {
          if (alert.type === 'RUPTURE') {
            this.notificationService.error(
              `⚠️ RUPTURE: ${alert.libelle} (Stock: ${alert.stockActuel})`
            );
          } else if (alert.type === 'ALERTE') {
            this.notificationService.warning(
              `⚠️ STOCK BAS: ${alert.libelle} (${alert.stockActuel}/${alert.seuilAlerte})`
            );
          }
        });
      });

    this.stockManagementService.stockUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(produitMisAJour => {
        this.actualiserArticleStockEnListe(produitMisAJour);
      });
  }

  private initRemiseMonitoring(): void {
    this.venteForm.get('remise')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(valeur => {
        this.recalculerTotalAvecRemise(valeur);
      });

    this.venteForm.get('typeRemise')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.venteForm.get('remise')?.reset(0);
      });
  }

  // ==================== CHARGEMENT DONNÉES ====================
private async chargerDonneesAvecFallback(): Promise<void> {
  this.loading = true;
  console.log('📥 Début chargement données...');

  try {
    // ✅ ÉTAPE 1 : Charger le cache IndexedDB
    const cachedArticles = await this.offlineSyncService.getCachedArticles();
    const cachedClients = await this.offlineSyncService.getCachedClients();

    // ✅ ÉTAPE 2 : Afficher le cache immédiatement
    if (cachedArticles.length > 0) {
      this.articles = cachedArticles;
      this.filteredArticles = [...this.articles];
      
      // ✅ IMPORTANT : Remplir le cache de stocks depuis IndexedDB
      cachedArticles.forEach(article => {
        if (article.id && article.stockFinal !== undefined) {
          this.stocksCache.set(article.id, article.stockFinal);
        }
      });
      
      this.stocksCacheTimestamp = Date.now();
      console.log(`✅ ${cachedArticles.length} articles + stocks chargés du cache`);
    }

    if (cachedClients.length > 0) {
      this.personnes = cachedClients;
      console.log(`✅ ${cachedClients.length} clients chargés du cache`);
    }

    // ✅ ÉTAPE 3 : Si online, rafraîchir en arrière-plan (NON-BLOQUANT)
    if (this.offlineSyncService.isOnline() && this.syncStatus.backendAvailable) {
      console.log('🌐 Mode online - Rafraîchissement en arrière-plan...');
      this.rafraichirDonneesEnArrierePlan();
    } else {
      console.log('📴 Mode offline - Utilisation exclusive du cache');
      
      if (cachedArticles.length === 0) {
        this.notificationService.warning(
          '⚠️ Aucun article en cache. Connexion requise pour la première utilisation.'
        );
      }
    }

  } catch (error) {
    console.error('❌ Erreur critique chargement:', error);
    this.notificationService.error('❌ Erreur chargement données');
  } finally {
    this.loading = false;
    console.log('✅ Chargement terminé - Caisse prête');
  }
}

/**
 * ✅ NOUVELLE MÉTHODE : Rafraîchissement en arrière-plan (non-bloquant)
 */
private async rafraichirDonneesEnArrierePlan(): Promise<void> {
  try {
    await Promise.all([
      this.chargerArticlesDepuisServeur(),
      this.chargerPersonnesDepuisServeur()
    ]);
    
    console.log('✅ Données serveur rafraîchies en arrière-plan');
    this.notificationService.info('🔄 Stocks mis à jour depuis le serveur');
    
  } catch (error) {
    console.warn('⚠️ Erreur rafraîchissement arrière-plan (non-critique):', error);
  }
}
private async chargerArticlesDepuisServeur(): Promise<void> {
  if (!this.user || !this.user.boutiqueid) {
    console.warn('⚠️ Pas d\'utilisateur ou de boutique');
    return;
  }

  return new Promise((resolve, reject) => {
    this.barcodeService.getProduitsAutoComplet(this.user!.boutiqueid!)
      .pipe(
        timeout(15000),
        catchError(error => {
          console.error('❌ Erreur chargement articles:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (produits: Produit[]) => {
          if (produits && produits.length > 0) {
            // Garantir stockFinal initialisé
            produits.forEach(p => {
              if (p.stockFinal === undefined || p.stockFinal === null) {
                p.stockFinal = 0;
              }
            });
            
            // ✅ IMPORTANT : Charger les stocks AVANT de mettre à jour l'UI
            await this.chargerStocksAvantAffichage(produits);
            
            // Maintenant les articles ont leurs stocks corrects
            this.articles = produits;
            this.filteredArticles = [...this.articles];
            
            // Sauvegarder dans IndexedDB avec stocks
            await this.offlineSyncService.cacheArticles(this.articles);
            
            console.log(`✅ ${produits.length} articles + stocks sauvegardés`);
            resolve();
          } else {
            console.warn('⚠️ Aucun article reçu du serveur');
            resolve();
          }
        },
        error: reject
      });
  });
}
/**
 * ✅ MÉTHODE CLÉ : Charger les stocks AVANT affichage
 */
private async chargerStocksAvantAffichage(produits: Produit[]): Promise<void> {
  const articleIds = produits
    .map(p => p.id)
    .filter((id): id is number => id !== undefined);

  if (articleIds.length === 0) {
    console.warn('⚠️ Aucun ID d\'article à charger');
    return;
  }

  console.log(`🔄 Chargement stocks pour ${articleIds.length} articles...`);

  return new Promise((resolve) => {
    this.stockManagementService.getStocksProduits(articleIds)
      .pipe(
        timeout(10000),
        catchError(error => {
          console.error('❌ Erreur chargement stocks:', error);
          return of(new Map());
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (stockMap) => {
          let stocksRecus = 0;
          
          // ✅ Mettre à jour les stocks dans les produits
          produits.forEach(article => {
            if (article.id && stockMap.has(article.id)) {
              const stock = stockMap.get(article.id)!;
              article.stockFinal = stock;
              
              // ✅ Mettre à jour le cache en mémoire
              this.stocksCache.set(article.id, stock);
              stocksRecus++;
            } else if (article.stockFinal === undefined || article.stockFinal === null) {
              article.stockFinal = 0;
              if (article.id) {
                this.stocksCache.set(article.id, 0);
              }
            }
          });
          
          this.stocksCacheTimestamp = Date.now();
          console.log(`✅ ${stocksRecus}/${articleIds.length} stocks mis à jour`);
          resolve();
        },
        error: (error) => {
          console.error('❌ Erreur finale stocks:', error);
          
          // En cas d'erreur, initialiser à 0
          produits.forEach(article => {
            if (article.stockFinal === undefined || article.stockFinal === null) {
              article.stockFinal = 0;
            }
            if (article.id) {
              this.stocksCache.set(article.id, article.stockFinal);
            }
          });
          
          this.stocksCacheTimestamp = Date.now();
          resolve();
        }
      });
  });
}

  private async chargerStocks(produits: Produit[]): Promise<void> {
    const articleIds = produits
      .map(p => p.id)
      .filter((id): id is number => id !== undefined);

    if (articleIds.length === 0) return;

    return new Promise((resolve) => {
      this.stockManagementService.getStocksProduits(articleIds)
        .pipe(
          timeout(10000),
          catchError(error => {
            console.error('❌ Erreur chargement stocks:', error);
            return of(new Map());
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (stockMap) => {
            this.articles.forEach(article => {
              if (article.id && stockMap.has(article.id)) {
                article.stockFinal = stockMap.get(article.id)!;
              } else if (article.stockFinal === undefined || article.stockFinal === null) {
                article.stockFinal = 0;
              }
            });
            
            this.filteredArticles = [...this.articles];
            
            const articlesEnStock = this.articles.filter(a => a.stockFinal > 0);
            console.log(`✅ Stocks mis à jour: ${articlesEnStock.length}/${this.articles.length} articles en stock`);
            
            resolve();
          },
          error: (error) => {
            console.error('❌ Erreur finale stocks:', error);
            this.articles.forEach(article => {
              if (article.stockFinal === undefined || article.stockFinal === null) {
                article.stockFinal = 0;
              }
            });
            resolve();
          }
        });
    });
  }

  private async chargerPersonnesDepuisServeur(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.barcodeService.getAllPersons()
        .pipe(
          timeout(10000),
          catchError(error => {
            console.error('❌ Erreur chargement clients:', error);
            return of([]);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: async (data: Person[]) => {
            if (data && data.length > 0) {
              this.personnes = data;
              await this.offlineSyncService.cacheClients(this.personnes);
              console.log(`✅ ${data.length} clients chargés`);
            }
            resolve();
          },
          error: reject
        });
    });
  }

  // ==================== GESTION OFFLINE INFO ====================
  private hasSeenOfflineInfo(): boolean {
    return localStorage.getItem('offline-info-seen') === 'true';
  }

  private markOfflineInfoSeen(): void {
    localStorage.setItem('offline-info-seen', 'true');
  }

  closeOfflineInfoModal(): void {
    this.showOfflineInfoModal = false;
  }

  // ==================== VALIDATION VENTE ====================
  validerVente(): void {
    console.log('💰 Validation vente...');

    if (this.caisseItems.length === 0) {
      this.notificationService.error('❌ Panier vide');
      return;
    }

    if (!this.verifierStockAvantVente()) {
      this.notificationService.error('❌ Stock insuffisant');
      return;
    }

    if (this.typePaiementSelectionne === 'ESPECES' && 
        this.montantRecu < this.montantTotalApaye) {
      this.notificationService.error('❌ Montant reçu insuffisant');
      return;
    }

    this.loading = true;
    this.enregistrerVenteLocale();
  }

  private async enregistrerVenteLocale(): Promise<void> {
    try {
      console.log('💾 Sauvegarde locale de la vente...');

      const userinsert = this.userService.getUserConnected();
      
      const paiementsAuto = ['MOBILE_MONEY', 'ORANGE_MONEY', 'EXPRESS_UNION', 'CARTE_BANCAIRE'];
      if (paiementsAuto.includes(this.typePaiementSelectionne)) {
        this.montantRecu = this.montantTotalApaye;
      }

      const venteOffline: VenteOffline = {
        localId: '',
        numeroTicket: this.numeroTicket,
        date: new Date(),
        items: [...this.caisseItems],
        montantTotal: this.montantTotal,
        typePaiement: this.typePaiementSelectionne,
        montantRecu: this.montantRecu,
        monnaieRendue: this.monnaieRendue,
        montantNet: this.checkMontantApaye(),
        client: this.getDefautClient(),
        userinsert: userinsert?.username || 'inconnu',
        remise: this.montantRemise || 0,
        statut: 'TERMINEE',
        synced: false,
        tentativeSync: 0,
        numerocommande: this.numerocommande
      };

      const localId = await this.offlineSyncService.saveVenteLocally(venteOffline);
      
      console.log('✅ Vente sauvegardée localement:', localId);

      this.venteValidee = venteOffline as any;
      this.venteid = 0;

      this.decrementStocksApresVente();

      this.notificationService.success(
        this.isOfflineMode 
          ? '✅ Vente enregistrée (mode offline)'
          : '✅ Vente enregistrée'
      );

      this.showPaiementModal = false;
      this.showConfirmationModal = true;
      this.loading = false;

      if (!this.isOfflineMode) {
        console.log('🔄 Synchronisation automatique en cours...');
      }

    } catch (error) {
      console.error('❌ Erreur critique sauvegarde vente:', error);
      this.notificationService.error('❌ Erreur enregistrement vente');
      this.loading = false;
    }
  }

  // ==================== RELANCE DES VENTES EN ECHEC DEFINITIF ====================
  async retryFailedSales(): Promise<void> {
    const failedSales = await this.offlineSyncService.getFailedSales();
    if (failedSales.length === 0) {
      return;
    }

    for (const vente of failedSales) {
      await this.offlineSyncService.retryFailedSale(vente.localId);
    }

    this.notificationService.info(
      `🔄 ${failedSales.length} vente(s) remise(s) en file - nouvelle tentative...`
    );

    this.synchroniserMaintenant();
  }

  // ==================== SYNCHRONISATION MANUELLE ====================
  synchroniserMaintenant(): void {
    console.log('🔄 Synchronisation manuelle demandée');

    if (!this.offlineSyncService.isOnline()) {
      this.notificationService.error('❌ Pas de connexion Internet');
      return;
    }

    if (!this.syncStatus.backendAvailable) {
      this.notificationService.error('❌ Serveur inaccessible');
      return;
    }

    if (this.syncStatus.syncInProgress) {
      this.notificationService.warning('⏳ Synchronisation déjà en cours...');
      return;
    }

    this.loading = true;

    this.offlineSyncService.forceSyncNow()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('✅ Résultat sync:', result);
          
          if (result.synced > 0) {
            this.notificationService.success(
              `✅ ${result.synced}/${result.total} vente(s) synchronisée(s)`
            );
          }
          
          if (result.errors > 0) {
            this.notificationService.warning(
              `⚠️ ${result.errors} erreur(s) de synchronisation`
            );
          }

          if (result.synced === 0 && result.errors === 0) {
            this.notificationService.info('ℹ️ Aucune vente à synchroniser');
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur synchronisation:', error);
          this.notificationService.error('❌ Erreur synchronisation');
          this.loading = false;
        }
      });
  }

  // ==================== IMPRESSION ====================
  imprimerTicket(ticketId: number): void {
    console.log('🖨️ Impression ticket:', ticketId);

    if (this.isOfflineMode || ticketId === 0) {
      this.imprimerTicketLocal();
    } else {
      if (this.venteid > 0) {
        this.barcodeService.downloadTicketVenteTXT(this.venteid)
          .pipe(
            timeout(10000),
            catchError(error => {
              console.error('❌ Erreur téléchargement ticket:', error);
              this.notificationService.warning('⚠️ Impression ticket local');
              this.imprimerTicketLocal();
              return of(null);
            })
          )
          .subscribe(blob => {
            if (blob) {
              const file = new Blob([blob], { type: 'text/plain;charset=utf-8' });
              this.printService.imprimerAvecPrevisualisation(file);
            }
          });
      } else {
        this.imprimerTicketLocal();
      }
    }
  }

  telechargerTicket(ticketId: number): void {
    console.log('💾 Téléchargement ticket:', ticketId);

    if (this.isOfflineMode || ticketId === 0) {
      const ticket = this.genererTicketTexte(this.venteValidee);
      const blob = new Blob([ticket], { type: 'text/plain;charset=utf-8' });
      this.telechargerBlob(blob, `ticket_${this.numeroTicket}.txt`);
    } else {
      if (this.venteid > 0) {
        this.barcodeService.downloadTicketVenteTXT(this.venteid)
          .pipe(
            timeout(10000),
            catchError(error => {
              console.error('❌ Erreur téléchargement:', error);
              const ticket = this.genererTicketTexte(this.venteValidee);
              const blob = new Blob([ticket], { type: 'text/plain;charset=utf-8' });
              return of(blob);
            })
          )
          .subscribe(blob => {
            this.telechargerBlob(blob, `ticket-vente-${this.venteid || this.numeroTicket}.txt`);
          });
      }
    }
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private genererTicketTexte(vente: any): string {
    const ligne = (texte: string) => texte + '\n';
    const sep = '================================\n';
    
    let ticket = '';
    ticket += ligne('╔════════════════════════════════╗');
    ticket += ligne('║     TICKET DE CAISSE           ║');
    ticket += ligne('╚════════════════════════════════╝');
    ticket += ligne('');
    ticket += ligne('  Librairie Papeterie & Diverses');
    ticket += ligne('Car-Lycée Akwa Nord Bonamoussadi');
    ticket += ligne('   BP: 24231 DOUALA-CAMEROUN');
    ticket += ligne('         Tel: 699967894');
    ticket += sep;
    
    const clientNom = vente.client ? 
      `${vente.client.nom} ${vente.client.prenom}` : 
      'Client de passage';
    
    ticket += ligne(`Client    : ${clientNom}`);
    ticket += ligne(`Caissier  : ${vente.userinsert}`);
    ticket += ligne(`Date      : ${this.formatDate(vente.date)}`);
    ticket += ligne(`Ticket N° : ${vente.numeroTicket}`);
    ticket += sep;
    
    ticket += ligne('ARTICLES:');
    ticket += ligne('');
    
    vente.items.forEach((item: CaisseItem, index: number) => {
      const numero = (index + 1).toString().padStart(2, ' ');
      ticket += ligne(`${numero}. ${item.article.libelle}`);
      ticket += ligne(`    ${item.quantite.toFixed(2)} x ${this.formatMontant(item.prixUnitaire)} = ${this.formatMontant(item.montantTotal)}`);
    });
    
    ticket += sep;
    ticket += ligne(`Sous-total : ${this.formatMontant(vente.montantTotal)} FCFA`);
    
    if (vente.remise > 0) {
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
    
    if (this.isOfflineMode) {
      ticket += '\n' + sep;
      ticket += ligne('⚠️  VENTE HORS LIGNE');
      ticket += ligne('Sync auto dès reconnexion serveur');
    }
    
    return ticket;
  }

  // ==================== GESTION PANIER (VERSION ROBUSTE) ====================
  
  /**
   * ✅ VERSION ROBUSTE : Ajoute un article au panier (cache-first)
   * TOUJOURS utiliser le stock local, rafraîchir en arrière-plan
   */
 /**
 * ✅ VERSION FINALE : Utilise TOUJOURS le stock du cache
 */
ajouterArticleVente(article: Produit): void {
  console.log('➕ Ajout article:', article.libelle);
  
  // ✅ RÉCUPÉRER LE STOCK DEPUIS LE CACHE EN MÉMOIRE
  const stockCache = this.getStockDepuisCache(article.id!);
  const stockActuel = stockCache !== null ? stockCache : article.stockFinal;
  
  console.log(`   Stock utilisé: ${stockActuel} (cache: ${stockCache !== null})`);
  
  // ✅ Mettre à jour l'article avec le stock du cache
  if (stockCache !== null) {
    article.stockFinal = stockCache;
  }
  
  // ✅ Vérification du stock AVANT ajout
  if (stockActuel === undefined || stockActuel === null) {
    console.warn('⚠️ Stock indéfini pour', article.libelle);
    
    // Si online, essayer de rafraîchir
    if (!this.isOfflineMode && article.id) {
      this.notificationService.info('🔄 Vérification du stock...');
      this.rafraichirStockPuisAjouter(article);
      return;
    }
    
    // Si offline, bloquer
    this.notificationService.error(`❌ Stock indisponible: ${article.libelle}`);
    return;
  }
  
  // ✅ Vérifier stock insuffisant
  if (stockActuel <= 0) {
    if (!navigator.onLine) {
      this.notificationService.error(`❌ Rupture de stock: ${article.libelle}`);
      return;
    }
    
    const confirmer = confirm(
      `⚠️ Stock local = 0 pour "${article.libelle}".\n\n` +
      `Voulez-vous quand même l'ajouter ?\n` +
      `(Le stock sera vérifié lors de la validation)`
    );
    
    if (!confirmer) {
      return;
    }
  }
  
  // ✅ AJOUTER AU PANIER
  const existing = this.caisseItems.find(i => i.article.id === article.id);
  
  if (existing) {
    const newQty = existing.quantite + 1;
    
    if (stockActuel > 0 && newQty > stockActuel) {
      this.notificationService.warning(
        `⚠️ Stock disponible: ${stockActuel} unité(s)`
      );
      
      if (!navigator.onLine) {
        return;
      }
    }
    
    this.modifierQuantite(existing, newQty);
  } else {
    this.caisseItems.push({
      article,
      quantite: 1,
      prixUnitaire: article.prixVenteTTC,
      montantTotal: article.prixVenteTTC
    });
  }

  this.calculerMontantTotal();
  this.venteForm.patchValue({ barcode: '' });
  this.focusBarcodeInput();
  
  console.log('✅ Article ajouté au panier');
  
  // ✅ Rafraîchir en arrière-plan (optionnel, non-bloquant)
  if (!this.isOfflineMode && article.id && this.isCacheExpire()) {
    this.rafraichirStockEnArrierePlan(article);
  }
}

/**
 * ✅ NOUVELLE MÉTHODE : Récupérer le stock depuis le cache en mémoire
 */
private getStockDepuisCache(articleId: number): number | null {
  if (!this.stocksCache.has(articleId)) {
    return null;
  }
  
  return this.stocksCache.get(articleId)!;
}

/**
 * ✅ NOUVELLE MÉTHODE : Vérifier si le cache est expiré
 */
private isCacheExpire(): boolean {
  const age = Date.now() - this.stocksCacheTimestamp;
  return age > this.STOCK_CACHE_DURATION;
}

/**
 * ✅ NOUVELLE MÉTHODE : Rafraîchir le stock puis ajouter
 */
private rafraichirStockPuisAjouter(article: Produit): void {
  if (!article.id) return;
  
  this.stockManagementService.getStockProduit(article.id, true)
    .pipe(
      timeout(5000),
      catchError(error => {
        console.error('❌ Erreur récupération stock:', error);
        this.notificationService.error('❌ Impossible de vérifier le stock');
        return of(null);
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (stock) => {
        if (stock !== null) {
          article.stockFinal = stock;
          
          // Mettre à jour le cache
          this.stocksCache.set(article.id!, stock);
          this.stocksCacheTimestamp = Date.now();
          
          console.log(`✅ Stock rafraîchi: ${article.libelle} = ${stock}`);
          
          // Réessayer l'ajout
          this.ajouterArticleVente(article);
        } else {
          this.notificationService.error('❌ Stock indisponible');
        }
      }
    });
}



/**
 * ✅ Rafraîchissement en arrière-plan (non-bloquant)
 */
private rafraichirStockEnArrierePlan(article: Produit): void {
  if (!article.id) return;
  
  this.stockManagementService.getStockProduit(article.id, true)
    .pipe(
      timeout(3000),
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (stockActuel) => {
        if (stockActuel !== null && stockActuel !== article.stockFinal) {
          console.log(`🔄 Stock rafraîchi: ${article.libelle} ${article.stockFinal} → ${stockActuel}`);
          
          article.stockFinal = stockActuel;
          this.stocksCache.set(article.id!, stockActuel);
          this.actualiserArticleStockEnListe(article);
          
          // Avertir si conflit
          const itemDansLePanier = this.caisseItems.find(i => i.article.id === article.id);
          if (itemDansLePanier && itemDansLePanier.quantite > stockActuel) {
            this.notificationService.warning(
              `⚠️ ${article.libelle}: Stock réel = ${stockActuel}, ` +
              `quantité panier = ${itemDansLePanier.quantite}`
            );
          }
        }
      }
    });
}


  /**
   * ✅ VERSION ROBUSTE : Ajouter avec le stock local
   */
  private ajouterArticleAvecStockLocal(article: Produit): void {
    const stock = article.stockFinal !== undefined && article.stockFinal !== null 
      ? article.stockFinal 
      : 0;

    console.log(`   → Stock utilisé: ${stock}`);

    // ✅ Gestion souple du stock = 0
    if (stock <= 0) {
      // En mode offline strict, bloquer
      if (!navigator.onLine) {
        this.notificationService.error(`❌ Rupture de stock: ${article.libelle}`);
        return;
      }
      
      // En mode semi-offline, avertir mais permettre avec confirmation
      const confirmer = confirm(
        `⚠️ Stock local = 0 pour "${article.libelle}".\n\n` +
        `Voulez-vous quand même l'ajouter ?\n` +
        `(Le stock sera vérifié lors de la validation)`
      );
      
      if (!confirmer) {
        return;
      }
    }

    const existing = this.caisseItems.find(i => i.article.id === article.id);
    
    if (existing) {
      const newQty = existing.quantite + 1;
      
      if (stock > 0 && newQty > stock) {
        this.notificationService.warning(
          `⚠️ Stock local = ${stock}. Stock réel en cours de vérification...`
        );
        
        if (!navigator.onLine) {
          return;
        }
      }
      
      this.modifierQuantite(existing, newQty);
    } else {
      this.caisseItems.push({
        article,
        quantite: 1,
        prixUnitaire: article.prixVenteTTC,
        montantTotal: article.prixVenteTTC
      });
    }

    this.calculerMontantTotal();
    this.venteForm.patchValue({ barcode: '' });
    this.focusBarcodeInput();
    
    console.log('✅ Article ajouté au panier');
  }

modifierQuantite(item: CaisseItem, qty: number): void {
  if (qty <= 0) {
    this.supprimerItem(this.caisseItems.indexOf(item));
    return;
  }

  // ✅ Utiliser le stock du cache
  const stockCache = this.getStockDepuisCache(item.article.id!);
  const stock = stockCache !== null ? stockCache : (item.article.stockFinal || 0);
  
  if (qty > stock) {
    this.notificationService.warning(
      `⚠️ Stock insuffisant: ${stock} disponible${stock > 1 ? 's' : ''}`
    );
    return;
  }

  item.quantite = qty;
  item.montantTotal = qty * item.prixUnitaire;
  this.calculerMontantTotal();
}
  supprimerItem(index: number): void {
    if (index >= 0 && index < this.caisseItems.length) {
      const item = this.caisseItems[index];
      console.log('🗑️ Suppression article:', item.article.libelle);
      this.caisseItems.splice(index, 1);
      this.calculerMontantTotal();
    }
  }

  private calculerMontantTotal(): void {
    this.montantTotal = this.caisseItems.reduce(
      (sum, item) => sum + item.montantTotal, 
      0
    );
    
    const remise = this.venteForm.get('remise')?.value || 0;
    if (remise > 0) {
      this.recalculerTotalAvecRemise(remise);
    } else {
      this.montantTotalApaye = this.montantTotal;
    }
  }

  recalculerTotalAvecRemise(remise: number): void {
    if (this.venteForm.get('typeRemise')?.value === 'taux') {
      this.montantRemise = this.montantTotal * remise / 100;
    } else {
      this.montantRemise = remise;
    }
    this.montantTotalApaye = Math.max(0, this.montantTotal - this.montantRemise);
  }

  /**
   * ✅ VERSION RENFORCÉE : Vérification avant validation
   */
 private verifierStockAvantVente(): boolean {
  console.log('🔍 Vérification des stocks avant validation...');

  for (const item of this.caisseItems) {
    // ✅ Utiliser le stock du cache
    const stockCache = this.getStockDepuisCache(item.article.id!);
    const stock = stockCache !== null ? stockCache : (item.article.stockFinal || 0);
    
    if (stock <= 0) {
      if (!navigator.onLine) {
        this.notificationService.error(`❌ Rupture: ${item.article.libelle}`);
        return false;
      }
      
      const confirmer = confirm(
        `⚠️ Stock local = 0 pour "${item.article.libelle}".\n\n` +
        `Voulez-vous quand même valider ?\n` +
        `(Le backend vérifiera le stock réel)`
      );
      
      if (!confirmer) {
        return false;
      }
    }
    
    if (stock > 0 && item.quantite > stock) {
      const confirmer = confirm(
        `⚠️ Stock local insuffisant pour "${item.article.libelle}":\n` +
        `Demandé: ${item.quantite}, Disponible: ${stock}\n\n` +
        `Continuer ? (Le backend vérifiera le stock réel)`
      );
      
      if (!confirmer) {
        return false;
      }
    }
  }
  
  return true;
}

 private decrementStocksApresVente(): void {
  const itemsToDecrement = this.caisseItems
    .filter(item => item.article.id && !item.article.reference.startsWith('LIBRE_'))
    .map(item => ({ 
      articleId: item.article.id!, 
      quantite: item.quantite 
    }));

  if (itemsToDecrement.length === 0) {
    return;
  }

  // ✅ NOUVEAU : Décrémenter le cache immédiatement (optimiste)
  this.caisseItems.forEach(item => {
    if (item.article.id) {
      const stockActuel = this.getStockDepuisCache(item.article.id) || item.article.stockFinal || 0;
      const nouveauStock = Math.max(0, stockActuel - item.quantite);
      
      this.stocksCache.set(item.article.id, nouveauStock);
      item.article.stockFinal = nouveauStock;
    }
  });

  if (this.isOfflineMode) {
    this.offlineSyncService.cacheArticles(this.articles);
    return;
  }

  // ... reste du code existant ...
}

  private rafraichirArticlesApresVente(): void {
    if (this.isOfflineMode) return;

    const articleIds = this.caisseItems
      .map(item => item.article.id)
      .filter((id): id is number => id !== undefined);

    articleIds.forEach(id => {
      this.stockManagementService.refreshArticleStock(id)
        .pipe(
          debounceTime(500),
          timeout(5000),
          catchError(error => {
            console.error('❌ Erreur refresh stock:', error);
            return of(null);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (articleMisAJour) => {
            if (articleMisAJour) {
              this.actualiserArticleStockEnListe(articleMisAJour);
            }
          }
        });
    });
  }

  private actualiserArticleStockEnListe(articleMisAJour: Produit): void {
    const idx1 = this.articles.findIndex(a => a.id === articleMisAJour.id);
    if (idx1 !== -1) {
      this.articles[idx1] = articleMisAJour;
    }

    const idx2 = this.filteredArticles.findIndex(a => a.id === articleMisAJour.id);
    if (idx2 !== -1) {
      this.filteredArticles[idx2] = articleMisAJour;
    }
  }

  // ==================== UI EVENTS ====================
  onBarcodeInput(event: any): void {
    const barcode = event.target.value?.trim();
    if (!barcode) return;

    console.log('🔍 Code-barres:', barcode);

    this.barcodeService.verificationNumeTicketForEcom(barcode)
      .pipe(
        timeout(5000),
        catchError(error => {
          console.warn('⚠️ Pas de commande e-commerce:', error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (venteExistante: Vente | null) => {
          if (venteExistante?.id) {
            console.log('✅ Commande e-commerce trouvée');
            this.numerocommande = venteExistante.numerocommande || 0;
            this.caisseItems = [...venteExistante.items];
            this.venteForm.patchValue({ barcode: '' });
            this.calculerMontantTotal();
            this.notificationService.success('✅ Commande chargée');
          } else {
            this.venteForm.patchValue({ barcode: '' });
          }
        }
      });
  }

  onSearchInput(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredArticles = this.articles.filter(article =>
      article.libelle.toLowerCase().includes(term) ||
      article.reference.toLowerCase().includes(term)
    );
  }

  onSearchInputRef(ref: string): void {
    if (!ref.trim()) return;

    console.log('🔍 Recherche référence:', ref);

    this.barcodeService.getArticleByReference(ref.trim())
      .pipe(
        timeout(5000),
        catchError(error => {
          console.warn('⚠️ Article non trouvé:', error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (article) => {
          if (article?.id) {
            this.ajouterArticleVente(article);
          } else {
            this.notificationService.warning('⚠️ Article non trouvé');
            this.openArticleModal();
          }
        }
      });
  }

  onQuantiteChange(item: CaisseItem, event: any): void {
    const qty = parseInt(event.target.value);
    if (qty > 0) {
      this.modifierQuantite(item, qty);
    }
  }

  onPrixChange(item: CaisseItem, event: any): void {
    const prix = parseFloat(event.target.value);
    if (prix >= 0) {
      item.prixUnitaire = prix;
      item.montantTotal = item.quantite * prix;
      this.calculerMontantTotal();
    }
  }

  onMontantRecuInput(event: any): void {
    this.montantRecu = parseFloat(event.target.value) || 0;
    const total = this.montantTotalApaye || this.montantTotal;
    this.monnaieRendue = Math.max(0, this.montantRecu - total);
  }

  // ==================== MODALS ====================
  openArticleModal(): void {
    if(this.articles.length===0){
      this.chargerArticlesDepuisServeur();
    }
    this.showArticleModal = true;
    this.filteredArticles = [...this.articles];
  }

  openPaiementModal(type: string): void {
    this.typePaiementSelectionne = type === 'especes' ? 'ESPECES' : 'CARTE_BANCAIRE';
    this.montantRecu = 0;
    this.monnaieRendue = 0;
    this.showPaiementModal = true;
    this.montantTotalApaye = this.montantTotal - this.montantRemise;
  }

  ajouterArticleNonStock(): void {
    if (!this.articleForm.valid) return;

    const val = this.articleForm.value;
    const libre: Produit = {
      id: Date.now(),
      libelle: val.libelle,
      reference: `LIBRE_${Date.now()}`,
      prixVenteTTC: val.prixUnitaire,
      stockFinal: 9999,
      prixVenteModifiable: true,
      pacquets: false,
      quantiteByPacquet: 0,
      quantitePrete: 0,
      quantiteLivree: 0,
      prixVenteNet: val.prixUnitaire,
      deletes: false,
      remise: 0,
      tva: 0
    };

    this.caisseItems.push({
      article: libre,
      quantite: val.quantite,
      prixUnitaire: val.prixUnitaire,
      montantTotal: val.quantite * val.prixUnitaire
    });

    this.calculerMontantTotal();
    this.articleForm.reset({ quantite: 1, prixUnitaire: 0 });
    this.showArticleModal = false;
    this.focusBarcodeInput();
  }

  creerClient(): void {
    if (!this.clientForm.valid) return;

    const nouveau: Person = { ...this.clientForm.value };

    if (this.isOfflineMode) {
      nouveau.id = Date.now();
      this.personnes.push(nouveau);
      this.venteForm.patchValue({ client: nouveau.id });
      this.offlineSyncService.cacheClients(this.personnes);
      this.notificationService.success('✅ Client créé localement');
      this.clientForm.reset();
      this.showClientModal = false;
      return;
    }

    this.barcodeService.createPerson(nouveau)
      .pipe(
        timeout(10000),
        catchError(error => {
          console.error('❌ Erreur création client:', error);
          nouveau.id = Date.now();
          this.personnes.push(nouveau);
          this.offlineSyncService.cacheClients(this.personnes);
          this.notificationService.warning('⚠️ Client créé localement uniquement');
          return of(nouveau);
        })
      )
      .subscribe({
        next: (client) => {
          if (client && !this.personnes.find(p => p.id === client.id)) {
            this.personnes.push(client);
            this.offlineSyncService.cacheClients(this.personnes);
          }
          this.venteForm.patchValue({ client: client.id });
          this.notificationService.success('✅ Client créé');
        }
      });

    this.clientForm.reset();
    this.showClientModal = false;
  }

  verifierBonAchat(): void {
    if (!this.bonAchatCode) return;
    
    setTimeout(() => {
      this.bonAchatValide = true;
      this.montantBonAchat = Math.min(1000, this.montantTotal);
      this.resteApresBonAchat = Math.max(0, this.montantTotal - this.montantBonAchat);
    }, 500);
  }

  // ==================== UTILITAIRES ====================
  private genererNumeroTicket(): void {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    this.numeroTicket = `TKT${timestamp}`;
  }

  private focusBarcodeInput(): void {
    setTimeout(() => {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);
  }

  private checkMontantApaye(): number {
    return this.montantTotalApaye === 0 ? this.montantTotal : this.montantTotalApaye;
  }

  private getDefautClient(): Person | undefined {
    const clientId = this.venteForm.get('client')?.value;
    if (clientId) {
      return this.personnes.find(p => p.id == clientId);
    }
    return {
      matricule: "0000000",
      nom: 'Client de passage',
      prenom: "",
      telephone: "0000000",
      email: ""
    };
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  }

  getMontantEnLettres(): string {
    if (this.montantTotal === 0) return '';
    const m = Math.floor(this.montantTotal);
    return m < 1000 
      ? `${m} francs CFA` 
      : `${m.toLocaleString('fr-FR')} francs CFA`;
  }

  reduireLibelle(libelle: string, max: number = 30): string {
    return libelle.length > max ? libelle.slice(0, max) + '...' : libelle;
  }

  refreshApplication(): void {
    console.log('🔄 Rechargement application');
    this.loading = true;
    window.location.reload();
  }

  async nouvelleVente(): Promise<void> {
    console.log('🆕 Nouvelle vente');
    this.loading = true;
    
    this.caisseItems = [];
    this.montantTotal = 0;
    this.montantTotalApaye = 0;
    this.montantRemise = 0;
    this.venteForm.reset({ typeRemise: 'taux', remise: 0 });
    this.bonAchatCode = '';
    this.numerocommande = 0;
    
    await this.chargerDonneesAvecFallback();
    
    this.genererNumeroTicket();
    this.showConfirmationModal = false;
    this.focusBarcodeInput();
    this.loading = false;
  }

  toggleSyncDetails(): void {
    this.showSyncDetails = !this.showSyncDetails;
  }

  onConnectionStatusChange(isOnline: boolean): void {
    this.showStatusToast = true;
    
    if (this.statusToastTimeout) {
      clearTimeout(this.statusToastTimeout);
    }
    
    this.statusToastTimeout = setTimeout(() => {
      this.showStatusToast = false;
    }, 3000);
    
    if (!isOnline && !localStorage.getItem('offline-info-shown')) {
      this.showOfflineInfoModal = true;
      localStorage.setItem('offline-info-shown', 'true');
    }
  }

  
/**
 * 🐛 MÉTHODE DE DIAGNOSTIC : Afficher les infos dans la console
 */
diagnosticStocks(): void {
  console.clear();
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     DIAGNOSTIC STOCKS - POINT DE VENTE    ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
  
  // 1. Informations générales
  console.log('📊 INFORMATIONS GÉNÉRALES');
  console.log('   Nombre d\'articles:', this.articles?.length || 0);
  console.log('   Articles filtrés:', this.filteredArticles?.length || 0);
  console.log('   Taille du cache:', this.stocksCache?.size || 0);
  console.log('   Cache timestamp:', new Date(this.stocksCacheTimestamp).toLocaleString());
  console.log('   Mode offline:', this.isOfflineMode);
  console.log('   Online:', navigator.onLine);
  console.log('   Backend disponible:', this.syncStatus.backendAvailable);
  console.log('');
  
  // 2. Utilisateur et boutique
  console.log('👤 UTILISATEUR');
  console.log('   User:', this.user?.userName || 'Non défini');
  console.log('   Boutique ID:', this.user?.boutiqueid || 'Non défini');
  console.log('');
  
  // 3. Premiers articles
  console.log('📦 PREMIERS ARTICLES (5)');
  if (this.articles && this.articles.length > 0) {
    this.articles.slice(0, 5).forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.libelle}`);
      console.log(`      → ID: ${article.id}`);
      console.log(`      → Référence: ${article.reference}`);
      console.log(`      → stockFinal: ${article.stockFinal}`);
      console.log(`      → Cache: ${this.stocksCache?.get(article.id!) ?? 'non trouvé'}`);
      console.log('');
    });
  } else {
    console.log('   ⚠️ Aucun article chargé');
  }
  
  // 4. Cache stocks
  console.log('💾 CACHE STOCKS');
  if (this.stocksCache && this.stocksCache.size > 0) {
    console.log('   Premiers éléments du cache:');
    let count = 0;
    this.stocksCache.forEach((stock, articleId) => {
      if (count < 5) {
        const article = this.articles.find(a => a.id === articleId);
        console.log(`      Article ${articleId} (${article?.libelle || 'inconnu'}): ${stock}`);
        count++;
      }
    });
  } else {
    console.log('   ⚠️ Cache vide');
  }
  console.log('');
  
  // 5. Panier
  console.log('🛒 PANIER');
  console.log('   Articles dans le panier:', this.caisseItems?.length || 0);
  if (this.caisseItems && this.caisseItems.length > 0) {
    this.caisseItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.article.libelle} x${item.quantite}`);
    });
  }
  console.log('');
  
  // 6. Recommandations
  console.log('💡 DIAGNOSTIC');
  const problemes: string[] = [];
  
  if (!this.articles || this.articles.length === 0) {
    problemes.push('❌ Aucun article chargé');
  }
  
  if (!this.stocksCache || this.stocksCache.size === 0) {
    problemes.push('❌ Cache de stocks vide');
  }
  
  if (this.articles && this.articles.length > 0) {
    const articlesAvecStock = this.articles.filter(a => 
      a.stockFinal !== undefined && 
      a.stockFinal !== null && 
      a.stockFinal > 0
    );
    
    if (articlesAvecStock.length === 0) {
      problemes.push('❌ Aucun article avec stockFinal > 0');
    } else {
      console.log(`   ✅ ${articlesAvecStock.length}/${this.articles.length} articles ont du stock`);
    }
    
    const articlesSansStock = this.articles.filter(a => 
      a.stockFinal === undefined || 
      a.stockFinal === null
    );
    
    if (articlesSansStock.length > 0) {
      problemes.push(`⚠️ ${articlesSansStock.length} articles sans stockFinal défini`);
    }
  }
  
  if (!this.user?.boutiqueid) {
    problemes.push('❌ Pas de boutique ID configuré');
  }
  
  if (!navigator.onLine) {
    problemes.push('⚠️ Mode hors ligne');
  }
  
  if (!this.syncStatus.backendAvailable) {
    problemes.push('⚠️ Backend non disponible');
  }
  
  if (problemes.length > 0) {
    console.log('   Problèmes détectés:');
    problemes.forEach(p => console.log(`   ${p}`));
  } else {
    console.log('   ✅ Aucun problème détecté');
  }
  
  console.log('');
  console.log('╚═══════════════════════════════════════════╝');
  
  // Afficher aussi une alerte avec le résumé
  const resume = `
DIAGNOSTIC STOCKS

Articles: ${this.articles?.length || 0}
Cache: ${this.stocksCache?.size || 0}
Boutique ID: ${this.user?.boutiqueid || 'Non défini'}

${problemes.length > 0 ? 'PROBLÈMES:\n' + problemes.join('\n') : '✅ Tout semble OK'}

Consultez la console (F12) pour plus de détails.
  `;
  
  alert(resume);
}

/**
 * 🔄 MÉTHODE DE RECHARGEMENT : Forcer le reload complet des stocks
 */
async forceReloadStocks(): Promise<void> {
  console.log('🔄 RECHARGEMENT FORCÉ DES STOCKS');
  
  if (!this.user?.boutiqueid) {
    console.error('❌ Pas de boutique ID');
    alert('Erreur: Pas de boutique ID configuré');
    return;
  }
  
  this.loading = true;
  
  try {
    // 1. Récupérer les articles du serveur
    console.log('📡 Récupération des articles depuis le serveur...');
    
    const produits = await firstValueFrom(
      this.barcodeService.getProduitsAutoComplet(this.user.boutiqueid)
        .pipe(
          timeout(15000),
          catchError(error => {
            console.error('❌ Erreur récupération articles:', error);
            throw error;
          })
        )
    );
    
    if (!produits || produits.length === 0) {
      console.error('❌ Aucun article reçu du serveur');
      alert('Aucun article trouvé sur le serveur');
      return;
    }
    
    console.log(`✅ ${produits.length} articles reçus`);
    
    // 2. Récupérer les IDs
    const articleIds = produits
      .map(p => p.id)
      .filter((id): id is number => id !== undefined);
    
    console.log(`📋 ${articleIds.length} IDs à charger`);
    
    // 3. Charger TOUS les stocks en batch
    console.log('📡 Récupération des stocks en batch...');
    
    const stockMap = await firstValueFrom(
      this.stockManagementService.getStocksProduits(articleIds)
        .pipe(
          timeout(15000),
          catchError(error => {
            console.error('❌ Erreur récupération stocks:', error);
            throw error;
          })
        )
    );
    
    console.log(`✅ ${stockMap.size} stocks reçus`);
    
    // 4. Mettre à jour les articles avec leurs stocks
    let compteurOk = 0;
    let compteurZero = 0;
    
    produits.forEach(article => {
      if (article.id && stockMap.has(article.id)) {
        const stock = stockMap.get(article.id)!;
        article.stockFinal = stock;
        this.stocksCache.set(article.id, stock);
        
        if (stock > 0) {
          compteurOk++;
          console.log(`   ✅ ${article.libelle}: ${stock}`);
        } else {
          compteurZero++;
          console.log(`   ⚠️ ${article.libelle}: 0`);
        }
      } else {
        article.stockFinal = 0;
        if (article.id) {
          this.stocksCache.set(article.id, 0);
        }
        compteurZero++;
        console.log(`   ❌ ${article.libelle}: pas de stock reçu`);
      }
    });
    
    console.log(`📊 Résultat: ${compteurOk} avec stock, ${compteurZero} à zéro`);
    
    // 5. Mettre à jour l'UI
    this.articles = produits;
    this.filteredArticles = [...produits];
    this.stocksCacheTimestamp = Date.now();
    
    // 6. Sauvegarder dans IndexedDB
    await this.offlineSyncService.cacheArticles(this.articles);
    console.log('✅ Sauvegardé dans IndexedDB');
    
    // 7. Afficher le résultat
    const message = `
Rechargement terminé !

${produits.length} articles chargés
${compteurOk} avec stock > 0
${compteurZero} à zéro

${compteurOk === 0 ? '⚠️ ATTENTION: Aucun article avec stock !' : '✅ Stocks chargés avec succès'}
    `;
    
    alert(message);
    this.notificationService.success(`${compteurOk} stocks chargés`);
    
  } catch (error: any) {
    console.error('❌ Erreur complète:', error);
    
    const errorMessage = `
Erreur de rechargement

${error.message || 'Erreur inconnue'}

Vérifiez:
- La connexion Internet
- L'URL du backend
- Les logs dans la console (F12)
    `;
    
    alert(errorMessage);
    this.notificationService.error('Erreur rechargement stocks');
    
  } finally {
    this.loading = false;
  }
}

}