import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { ContentHeaderComponent } from '../content-header/content-header.component';
import { ControlSidebarComponent } from '../control-sidebar/control-sidebar.component';
import { AuthService } from '../auth/auth.service';
import { User } from '../bookshoop/model/user';
import { AlertStockComponent } from '../bookshoop/compoment/alert-stock/alert-stock.component';
import { ArticleService } from '../bookshoop/service/article.service';
import { Boutique } from '../bookshoop/model/boutique';
import { BoutiqueService } from '../bookshoop/service/boutique.service';
import { CompagnieService } from '../bookshoop/service/compagnie.service';

const ROLES_SYSTEME = ['SUPER_ADMIN', 'SYSTEM_ADMIN'];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    ContentHeaderComponent,
    ControlSidebarComponent,
    AlertStockComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponentComponent implements OnInit {
  user: User | null = null;
  boutique: Boutique | null = null;
  userSession: any;
  estCompteSysteme = false;
  infosSysteme: { totalCompagnies: number; compagniesActives: number; compagniesInactives: number } | null = null;

  @ViewChild('alertBox') alertBox!: AlertStockComponent;

  constructor(
    private renderer: Renderer2,
    private authService: AuthService,
    private articleService: ArticleService,
    private boutiqueService: BoutiqueService,
    private compagnieService: CompagnieService
  ) { }

  ngOnInit(): void {
    // Configuration AdminLTE
    this.renderer.addClass(document.body, 'sidebar-mini');
    this.renderer.addClass(document.body, 'layout-fixed');

    // Récupération de la session utilisateur
    this.userSession = this.authService.getUserFromStorage();

    console.log('🔍 Session complète:', this.userSession);

    // ✅ CORRECTION: accéder à usersDTO qui contient les données utilisateur
    if (this.userSession?.usersDTO) {
      this.user = this.userSession.usersDTO;
      if(!this.user) return;
      console.log('✅ User chargé:', this.user);
      console.log('✅ Boutique ID trouvé:', this.user.boutiqueid);

      this.estCompteSysteme = ROLES_SYSTEME.includes(this.user.role?.name ?? '');

      if (this.estCompteSysteme) {
        // Compte administrateur systeme (SUPER_ADMIN/SYSTEM_ADMIN) : aucune
        // compagnie/boutique rattachee, les endpoints metier (stock, ventes...)
        // lui sont explicitement fermes (voir TenantScopeFilter cote backend).
        // On affiche a la place des informations de niveau plateforme.
        this.chargerInfosSysteme();
        return;
      }

      // Récupérer la boutique si boutiqueid existe
      if (this.user.boutiqueid && this.user.boutiqueid > 0) {
        console.log('🔄 Chargement de la boutique ID:', this.user.boutiqueid);
        this.loadBoutique(this.user.boutiqueid);
      } else {
        console.warn('⚠️ Aucun boutiqueid trouvé pour cet utilisateur');
      }

      // Vérification du stock
      this.verifierStock();
    } else {
      console.error('❌ Aucune session utilisateur trouvée ou usersDTO manquant');
      console.log('Structure reçue:', this.userSession);
    }
  }

  /**
   * Informations utiles pour un administrateur systeme (aucune donnee
   * metier ne lui est accessible) : vue d'ensemble des compagnies de la
   * plateforme, pour anticiper/etre informe sans passer par les modules
   * de gestion d'une compagnie precise.
   */
  private chargerInfosSysteme(): void {
    this.compagnieService.getAll().subscribe({
      next: (compagnies) => {
        const actives = compagnies.filter(c => c.actif).length;
        this.infosSysteme = {
          totalCompagnies: compagnies.length,
          compagniesActives: actives,
          compagniesInactives: compagnies.length - actives
        };
      },
      error: (error) => {
        console.error('Erreur lors du chargement des informations systeme:', error);
      }
    });
  }

  /**
   * Charge les informations de la boutique
   */
  private loadBoutique(boutiqueId: number): void {
    console.log('📡 Appel API getBoutiqueById avec ID:', boutiqueId);
    
    this.boutiqueService.getBoutiqueById(boutiqueId).subscribe({
      next: (boutique: Boutique) => {
        this.boutique = boutique;
        console.log('✅ Boutique récupérée avec succès:', this.boutique);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la récupération de la boutique:', error);
        console.error('Détails:', error.message);
      }
    });
  }

  /**
   * Vérifie l'état du stock et affiche les alertes
   */
  verifierStock(): void {
    this.articleService.getAlerteStock().subscribe({
      next: (produits) => {
        if (produits.length > 0) {
          const messages = produits.map(p => ({
            name: `🛑 Rupture : ${p.libelle}`,
            ref: p.reference,
            quantity: p.stockFinalTheorie,
            category: p.categorieLibelle ?? undefined
          }));
          this.alertBox.display(messages);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification du stock:', error);
      }
    });
  }
}