// app-routing.module.ts - Version finale corrigée

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './module-users/login/login.component';
import { CompanySignupFormComponent } from './company-signup/company-signup-form/company-signup-form.component';
import { CompanySignupVerifyComponent } from './company-signup/company-signup-verify/company-signup-verify.component';
import { UsersComponent } from './module-users/users/users.component';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role-guard';
import { UserListComponent } from './user-manager/user-list/user-list.component';
import { UserFormComponent } from './user-manager/user-form/user-form.component';
import { UserDetailComponent } from './user-manager/user-detail/user-detail.component';
import { GeneralSettingsComponent } from './module-users/general-settings/general-settings.component';
import { SecuritySettingsComponent } from './module-users/security-settings/security-settings.component';
import { UserRoleComponent } from './user-manager/user-role/user-role.component';
import { UserProfilComponent } from './user-manager/user-profil/user-profil.component';
import { ModuleSecuriteComponent } from './user-manager/module-securite/module-securite.component';
import { UserManagementComponent } from './user-manager/user-management/user-management.component';
import { CommandComponent } from './bookshoop/compoment/command/command.component';
import { ArticlesComponent } from './bookshoop/compoment/articles/articles.component';
import { VenteComponent } from './bookshoop/compoment/vente/vente.component';
import { TransactionComponent } from './bookshoop/compoment/transaction/transaction.component';
import { HistoriqueCaisseComponent } from './bookshoop/compoment/historique-caisse/historique-caisse.component';
import { HistoriqueVenteComponent } from './bookshoop/compoment/historique-vente/historique-vente.component';
import { MargeVenteComponent } from './bookshoop/compoment/marge-vente/marge-vente.component';
import { InventaireComponent } from './bookshoop/compoment/inventaire/inventaire.component';
import { CorrectionStockComponent } from './bookshoop/compoment/correction-stock/correction-stock.component';
import { ControleCaisseComponent } from './bookshoop/compoment/controle-caisse/controle-caisse.component';
import { VentesArticlesComponent } from './bookshoop/compoment/ventes-articles/ventes-articles.component';
import { PointVentesComponent } from './bookshoop/compoment/point-ventes/point-ventes.component';
import { AdminLayoutComponentComponent } from './admin-layout.component/admin-layout.component';
import { StaticStockComponent } from './bookshoop/compoment/static-stock/static-stock.component';
import { ClientFormComponent } from './bookshoop/compoment/client-form/client-form.component';
import { ClientListComponent } from './bookshoop/compoment/client-form/client-list/client-list.component';
import { FactureFormComponent } from './bookshoop/compoment/facture-form/facture-form.component';
import { ProductsComponent } from './bookshoop/e-commerce/products/products.component';
import { CaddiesComponent } from './bookshoop/e-commerce/caddies/caddies.component';
import { NotFoundComponent } from './bookshoop/e-commerce/not-found/not-found.component';
import { OrderComponent } from './bookshoop/e-commerce/order/order.component';
import { ListOrderComponent } from './bookshoop/e-commerce/list-order/list-order.component';
import { DevisFormComponent } from './bookshoop/compoment/devis-form/devis-form.component';

import { DevisListComponent } from './bookshoop/compoment/devis-list/devis-list.component';
import { CommandesEnLigneComponent } from './bookshoop/compoment/commandes-en-ligne/commandes-en-ligne.component';
import { FactureListComponent } from './bookshoop/compoment/facture-list/facture-list.component';
import { VersementFormComponent } from './bookshoop/compoment/versement-form/versement-form.component';
import { VersementListComponent } from './bookshoop/compoment/versement-list/versement-list/versement-list.component';
import { VersementDetailComponent } from './bookshoop/compoment/versement-detail/versement-detail/versement-detail.component';
import { FactureDetailComponent } from './bookshoop/compoment/facture-detail/facture-detail/facture-detail.component';
import { RapportClientComponent } from './bookshoop/compoment/Rapport-Client/rapport-client/rapport-client.component';
import { DashboardTransfertStockComponent } from './bookshoop/compoment/transfert-stock/dashboard-transfert-stock/dashboard-transfert-stock.component';
import { GestionEntrepriseComponent } from './bookshoop/compoment/gestion-entreprise/gestion-entreprise.component';
import { MagasinComponent } from './bookshoop/compoment/magasin/magasin.component';
import { VilleComponent } from './bookshoop/compoment/ville/ville.component';
import { CategorieProduitComponent } from './bookshoop/compoment/categorie-produit/categorie-produit.component';
import { TypeClientComponent } from './bookshoop/compoment/type-client/type-client.component';
import { FournisseurComponent } from './bookshoop/compoment/fournisseur/fournisseur.component';
import { VerrouillageStockComponent } from './bookshoop/compoment/verrouillage-stock/verrouillage-stock.component';
import { CodeBareGestionComponent } from './bookshoop/compoment/code-bare-gestion/code-bare-gestion.component';
import { DestockageComponent } from './bookshoop/compoment/destockage/destockage.component';
import { ModePaiementComponent } from './bookshoop/compoment/mode-paiement/mode-paiement.component';
import { BonAchatComponent } from './bookshoop/compoment/bon-achat/bon-achat.component';
import { ControleVenteComponent } from './bookshoop/compoment/controle-vente/controle-vente.component';
import { PhotocopieComponent } from './bookshoop/compoment/photocopie/photocopie.component';
import { RessourceComponent } from './bookshoop/compoment/ressource/ressource.component';
import { ChargeComponent } from './bookshoop/compoment/charge/charge.component';
import { ElementRessourceDepenseComponent } from './bookshoop/compoment/element-ressource-depense/element-ressource-depense.component';
import { CompteClientComponent } from './bookshoop/compoment/compte-client/compte-client.component';
import { MargeComponent } from './bookshoop/compoment/marge/marge.component';
import { AnneeComponent } from './bookshoop/compoment/annee/annee.component';
import { SpecifiqueProduitComponent } from './bookshoop/compoment/specifique-produit/specifique-produit.component';
import { BoutiqueComponent } from './bookshoop/compoment/boutique/boutique.component';
import { CompagnieComponent } from './bookshoop/compoment/compagnie/compagnie.component';
import { SystemAdminComponent } from './bookshoop/compoment/system-admin/system-admin.component';
import { LicenceComponent } from './bookshoop/compoment/licence/licence.component';
import { AuditComponent } from './bookshoop/compoment/audit/audit.component';
import { MonEntrepriseComponent } from './bookshoop/compoment/mon-entreprise/mon-entreprise.component';
import { OptionEntrepriseComponent } from './bookshoop/compoment/option-entreprise/option-entreprise.component';
import { StockImportFormatComponent } from './bookshoop/compoment/stock-import-format/stock-import-format.component';
import { ChangePasswordComponent } from './module-users/change-password/change-password.component';
import { MesLicencesComponent } from './bookshoop/compoment/mes-licences/mes-licences.component';
import { StorefrontLayoutComponent } from './storefront/layout/storefront-layout.component';
import { StorefrontHomeComponent } from './storefront/home/storefront-home.component';
import { StorefrontCatalogComponent } from './storefront/catalog/storefront-catalog.component';
import { StorefrontCartComponent } from './storefront/cart/storefront-cart.component';
import { StorefrontCheckoutComponent } from './storefront/checkout/storefront-checkout.component';
import { StorefrontLoginComponent } from './storefront/login/storefront-login.component';
import { StorefrontRegisterComponent } from './storefront/register/storefront-register.component';
import { StorefrontOrdersComponent } from './storefront/orders/storefront-orders.component';
import { StorefrontProductDetailComponent } from './storefront/product-detail/storefront-product-detail.component';

export const routes: Routes = [
  // Routes publiques (sans guards)
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'inscription-compagnie',
    component: CompanySignupFormComponent
  },
  {
    path: 'verification-compagnie',
    component: CompanySignupVerifyComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent
  },

  // Routes e-commerce publiques
  {
    path: 'e-com',
    component: ProductsComponent
  },

  {
    path: 'order',
    component: OrderComponent
  },
  {
    path: 'caddy',
    component: CaddiesComponent
  },
  {
    path: 'liste-order',
    component: ListOrderComponent
  },

  // ========== SITE PUBLIC E-COMMERCE PAR COMPAGNIE ==========
  // Entierement hors de l'arbre AuthGuard : un visiteur anonyme doit pouvoir
  // parcourir le catalogue et commander sans session staff. Voir
  // EcomPublicController/EcomCheckoutController/EcomAuthController (backend)
  // et StorefrontTokenInterceptor (JWT client distinct du JWT staff).
  {
    path: 'shop/:code',
    component: StorefrontLayoutComponent,
    children: [
      { path: '', component: StorefrontHomeComponent },
      { path: 'boutique/:boutiqueId', component: StorefrontCatalogComponent },
      { path: 'boutique/:boutiqueId/produit/:produitId', component: StorefrontProductDetailComponent },
      { path: 'cart', component: StorefrontCartComponent },
      { path: 'checkout', component: StorefrontCheckoutComponent },
      { path: 'login', component: StorefrontLoginComponent },
      { path: 'register', component: StorefrontRegisterComponent },
      { path: 'orders', component: StorefrontOrdersComponent }
    ]
  },

  // Page 404
  {
    path: '404',
    component: NotFoundComponent
  },

  // Page non autorisée (pour RoleGuard)
  {
    path: 'unauthorized',
    component: NotFoundComponent // ou créez un composant spécifique UnauthorizedComponent
  },

  // Routes protégées avec layout admin
  {
    path: '',
    component: AdminLayoutComponentComponent,
    canActivate: [AuthGuard], // SEULEMENT AuthGuard sur la route parent
    children: [
      // Redirection par défaut
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Dashboard
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard] // RoleGuard seulement sur les routes enfants
      },

      // Gestion des utilisateurs
      {
        path: 'users',
        component: UserManagementComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['READ_USERS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'role',
        component: UserRoleComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_ROLES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'permission',
        component: UserProfilComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_ROLES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'module-securite',
        component: ModuleSecuriteComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_ROLES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'create',
        component: UserFormComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['CREATE_USER'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'detail/:id',
        component: UserDetailComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['READ_USERS'],
          permissionCheckMethod: 'any'
        }
      },

      // Paramètres
      {
        path: 'general',
        component: GeneralSettingsComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['READ_SETTINGS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'security',
        component: SecuritySettingsComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_SECURITY'],
          permissionCheckMethod: 'any'
        }
      },

      // Gestion des produits
      {
        path: 'product',
        component: ArticlesComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['READ_PRODUCTS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'product-list',
        component: ArticlesComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['READ_PRODUCTS'],
          permissionCheckMethod: 'any'
        }
      },

      // Gestion des stocks
      {
        path: 'transt-stock',
        component: TransactionComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'dashboard-transt-stock',
        component: DashboardTransfertStockComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'fournisseur',
        component: FournisseurComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'verrouillage-stock',
        component: VerrouillageStockComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'code-bare-gestion',
        component: CodeBareGestionComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'destockage',
        component: DestockageComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_STOCK'],
          permissionCheckMethod: 'any'
        }
      }
      , {
        path: 'inventaire-stock',
        component: InventaireComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['INVENTORY'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'update-stock',
        component: CorrectionStockComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['UPDATE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'staticStock',
        component: StaticStockComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_REPORTS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'mise-a-jour-stock',
        component: CommandComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['UPDATE_STOCK'],
          permissionCheckMethod: 'any'
        }
      },

      // Gestion des ventes
      {
        path: 'point-vent',
        component: PointVentesComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_SALES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'point-vente',
        component: CommandComponent,
        canActivate: [RoleGuard]
      },
      {
        path: 'vente-article',
        component: VentesArticlesComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_SALES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'code-bare',
        component: VenteComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['SCAN_PRODUCTS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'mode-paiement',
        component: ModePaiementComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_SALES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'bon-achat',
        component: BonAchatComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_SALES'],
          permissionCheckMethod: 'any'
        }
      },

      // Gestion des caisses
      {
        path: 'historique-caisse',
        component: HistoriqueCaisseComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_CASH_HISTORY'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'historique-vente',
        component: HistoriqueVenteComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_CASH_HISTORY'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'controle-caisse',
        component: ControleCaisseComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['CONTROL_CASH'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'marge-caisse',
        component: MargeVenteComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'controle-vente',
        component: ControleVenteComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'photocopie',
        component: PhotocopieComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'ressource',
        component: RessourceComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'type-resource',
        component: RessourceComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'charge',
        component: ChargeComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'type-depense',
        component: ChargeComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'element-ressource-depense',
        component: ElementRessourceDepenseComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'compte-client',
        component: CompteClientComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_SALES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'marge',
        component: MargeComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_MARGINS'],
          permissionCheckMethod: 'any'
        }
      },

      // Commandes et opérations
      {
        path: 'verouillage',
        component: CommandComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['LOCK_OPERATIONS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'commande',
        component: CommandComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_ORDERS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'destockage',
        component: CommandComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
       {
        path: 'entreprise',
        component: GestionEntrepriseComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
       {
        path: 'magasin',
        component: MagasinComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'boutique',
        component: BoutiqueComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
       {
        path: 'ville',
        component: VilleComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'categorie-produit',
        component: CategorieProduitComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'type-client',
        component: TypeClientComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'annee',
        component: AnneeComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'specifique-produit',
        component: SpecifiqueProduitComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['DESTOCK'],
          permissionCheckMethod: 'any'
        }
      },

      // ========== HIERARCHIE MULTI-COMPAGNIES ==========
      // Cote backend (microservice-administration), ces routes sont reservees
      // via @PreAuthorize a SUPER_ADMIN/SYSTEM_ADMIN - la securite reelle est
      // la, ces guards/permissions front ne sont qu'un filtrage d'affichage.
      {
        path: 'admin/compagnies',
        component: CompagnieComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_COMPAGNIES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'admin/system-admins',
        component: SystemAdminComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_SYSTEM_ADMINS'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'admin/licences',
        component: LicenceComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_LICENCES'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'admin/audit',
        component: AuditComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['VIEW_AUDIT'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'compagnie/mon-entreprise',
        component: MonEntrepriseComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_OWN_COMPAGNIE'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'compagnie/option-entreprise',
        component: OptionEntrepriseComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_OWN_COMPAGNIE'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'compagnie/initialisation-stock',
        component: StockImportFormatComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_OWN_COMPAGNIE'],
          permissionCheckMethod: 'any'
        }
      },
      {
        path: 'compagnie/mes-licences',
        component: MesLicencesComponent,
        canActivate: [RoleGuard],
        data: {
          permissions: ['MANAGE_OWN_LICENCE'],
          permissionCheckMethod: 'any'
        }
      },

      // ========== CLIENTS ==========
      {
        path: 'clients',
        children: [
          {
            path: '',
            component: ClientListComponent,
            data: { title: 'Clients' }
          },
          {
            path: 'nouveau',
            component: ClientFormComponent,
            data: { title: 'Créer Client' }
          },
          {
            path: ':id/edit',
            component: ClientFormComponent,
            data: { title: 'Modifier Client' }
          }
        ]
      },
      // ========== FACTURES ==========
      {
        path: 'factures',
        children: [
          {
            path: '',
            component: FactureListComponent
          },
          {
            path: 'create',
            component: FactureFormComponent
          },
          {
            path: ':id',
            component: FactureDetailComponent
          },
          {
            path: ':id/edit',
            component: FactureFormComponent
          }
        ]
      },
      // ========== DEVIS ==========
      {
        path: 'devis',
        children: [
          {
            path: '',
            component: DevisListComponent,
            data: { title: 'Devis' }
          },
          {
            path: 'nouveau',
            component: DevisFormComponent,
            data: { title: 'Créer Devis' }
          },
          {
            path: ':id/detail',
            component: DevisFormComponent,
            data: { title: 'voir Devis' }
          },
          {
            path: ':id/edit',
            component: DevisFormComponent,
            data: { title: 'Modifier Devis' }
          }
        ]
      },
      // ========== COMMANDES EN LIGNE ==========
      {
        path: 'commandes-en-ligne',
        component: CommandesEnLigneComponent,
        data: { title: 'Commandes en ligne' }
      },
      // ========== STOCK ==========
      {
        path: 'stock',
        component: StaticStockComponent,
        data: { title: 'Gestion Stock' }
      },

      // ========== RAPPORTS ==========
      {
        path: 'rapport',
        component: RapportClientComponent,
        data: { title: 'Rapport Facturation' }
      },
      // ========== FACTURES ==========
      {
        path: 'versements',
        children: [
          {
            path: '',
            component: VersementListComponent
          },
          {
            path: 'create',
            component: VersementFormComponent
          },
          {
            path: ':id',
            component: VersementDetailComponent
          }
        ]
      }
    ]
  },




  // Route wildcard (TOUJOURS EN DERNIER)
  {
    path: '**',
    redirectTo: '/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Mettre à true pour déboguer
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    onSameUrlNavigation: 'reload',
    // 'always' : les routes enfants (ex. storefront/*) heritent des params
    // du parent (:code) sans avoir a remonter via route.parent a chaque fois.
    paramsInheritanceStrategy: 'always'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }