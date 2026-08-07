import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
//import { MenuItem } from '../model/menu-item';
import { AuthService } from '../auth/auth.service';

import { MenuItem } from 'primeng/api';
import { User } from '../bookshoop/model/user';
import { ModuleUsersService } from '../bookshoop/service/module-users.service';
import { UserService } from '../bookshoop/service/user-service.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, of } from 'rxjs';
//import { MenuItem } from '../model/menu-item';
import { ModuleStatus } from '../bookshoop/enums/module-status';
import { Module } from '../model/module';
import { MenusUsers } from '../bookshoop/model/menus-users';
import { data } from 'jquery';
import { Menu } from '../model/menu';
import { LicenceService } from '../bookshoop/service/licence.service';

interface SidebarChildItem {
  title: string;
  icon: string;
  route: string;
  /** Contourne resultalMenu() (matrice Profil x Menu x Action) - pour les pages
   * de gestion compagnie que seul COMPANY_ADMIN voit, qui n'a pas de Profil. */
  alwaysVisible?: boolean;
}

interface SidebarMenuItem {
  title: string;
  icon: string;
  route: string;
  children: SidebarChildItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() user: User | null = null;
  imagePath = '../img/user2-160x160.jpg';

  //menuItems: MenuItem[] = [];
  modules: Module[] = [];
  menuUsers: Menu[] = [];;
  // Modules actifs de la licence de la compagnie courante - null = aucune restriction
  // de licence a appliquer (SUPER_ADMIN/SYSTEM_ADMIN, ou echec du fetch : fail-open
  // cote UI, la vraie securite reste cote backend @PreAuthorize).
  licenceModulesActifs: Set<string> | null = null;

  //private toastr: ToastrService;
  constructor(private authService: AuthService, private moduleUserService: ModuleUsersService, private userService: UserService, private toastr: ToastrService, private licenceService: LicenceService) {



  }
  ngOnInit(): void {
    if (this.user) {
      this.imagePath = this.user.profileImageUrl ?? '../img/user2-160x160.jpg';
    } else {
      this.imagePath = '../img/user2-160x160.jpg';
    }
    let username=this.userService.getUserConnected();

  this.userService.getUsernameModules(username.username).subscribe({
    next:(data:Module[])=>{
      this.modules=data;
    },
    error: (error: any) => {
        console.error('Erreur dans subscribe:', error);
       
      }
  });

  this.userService.getMenusUser(username.username).subscribe({
    next:(data:MenusUsers)=>{
      this.menuUsers=data.menus;
    },
    error: (error:any) =>{
        console.error('Erreur dans subscribe menus user:', error);
    }
  })

  this.licenceService.getMesModulesActifs().subscribe({
    next: (modules) => {
      this.licenceModulesActifs = modules ? new Set(modules) : null;
    },
    error: (error: any) => {
      console.error('Erreur lors de la recuperation des modules de licence:', error);
      this.licenceModulesActifs = null;
    }
  });

  //recuperation des menus utilisateur

  // Hierarchie multi-compagnies : ces comptes (super-admin/admin systeme) n'ont
  // aucun module/menu assigne via Usermodule/Usermenu, donc on ajoute ces liens
  // directement (sans passer par resultal/resultalMenu) plutot que de les cacher.
  // La securite reelle reste cote backend (@PreAuthorize).
  const role = this.authService.currentUserValue?.usersDTO?.role?.name;
  if (role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN') {
    this.menuItems.push({
      title: 'Compagnies',
      icon: 'fas fa-building',
      route: '/admin/compagnies',
      children: []
    });
  }
  if (role === 'SUPER_ADMIN') {
    this.menuItems.push({
      title: 'Admins Système',
      icon: 'fas fa-user-shield',
      route: '/admin/system-admins',
      children: []
    });
  }
  if (role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN') {
    this.menuItems.push({
      title: 'Licences',
      icon: 'fas fa-key',
      route: '/admin/licences',
      children: []
    });
  }
  if (role === 'SUPER_ADMIN' || this.authService.currentUserValue?.hasAuditAccess) {
    this.menuItems.push({
      title: 'Audit',
      icon: 'fas fa-clipboard-list',
      route: '/admin/audit',
      children: []
    });
  }
  if (role === 'COMPANY_ADMIN') {
    // Regroupees sous "Administration" plutot qu'en liens racine : ce sont des
    // pages de gestion de la compagnie, au meme titre que Configuration/Option
    // Entreprise. alwaysVisible : COMPANY_ADMIN n'a pas de Profil (voir
    // ProfilPermissionMatrixService), donc pas d'entree dans la matrice Menu x
    // Action pour ces pages - meme logique que les liens SUPER_ADMIN/SYSTEM_ADMIN
    // ci-dessus, la securite reelle reste cote backend (@PreAuthorize).
    const administration = this.menuItems.find(item => item.title === 'Administration');
    if (administration) {
      administration.children.push(
        { title: 'Mon Entreprise', icon: 'far fa-circle', route: '/compagnie/mon-entreprise', alwaysVisible: true },
        { title: 'Mes Licences', icon: 'far fa-circle', route: '/compagnie/mes-licences', alwaysVisible: true }
      );
    }
  }
  }
  hasPermission(item: MenuItem): boolean {

    //if (!item.permissions || item.permissions.length === 0) {
    //   return true;
    // }

    // return item.permissions.some(permission => this.authService.hasPermission(permission)); 
    return true;

  }

  hasChildPermissions(item: MenuItem): boolean {
    //if (!item.children || item.children.length === 0) {
    // return false;
    // }

    //return item.children.some(child => this.hasPermission(child));
    return true;
  }

  toggleExpanded(item: MenuItem): void {
    item.expanded = !item.expanded;
  }


  menuItems: SidebarMenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      children: []
    },
    {
      title: 'Securite',
      icon: 'fas fa-user-shield',
      route: '',
      children: [
        {
          title: 'Module Securite',
          icon: 'far fa-circle',
          route: '/module-securite'
        },
        {
          title: 'Utilisateurs',
          icon: 'far fa-circle',
          route: '/users'
        },
        {
          title: 'Roles',
          icon: 'far fa-circle',
          route: '/role'
        },
        {
          title: 'Profil',
          icon: 'far fa-circle',
          route: '/permission'
        }

      ]
    },
    {
      title: 'Administration',
      icon: 'fas fa-cogs',
      route: '',
      children: [
        {
          title: 'Configuration',
          icon: 'far fa-circle',
          route: '/general'
        },
        {
          title: 'Option Entreprise',
          icon: 'far fa-circle',
          route: '/compagnie/option-entreprise'
        },
        {
          title: 'Recond. session anterieur',
          icon: 'far fa-circle',
          route: '/security'
        },
      ]
    },
    {
      title: 'Stock',
      icon: 'fas fa-boxes',
      route: '',
      children: [
        {
          title: 'Produits',
          icon: 'far fa-circle',
          route: '/product-list'
        },
        {
          title: 'Transfert Stock',//ajouter
          icon: 'far fa-circle',
          route: '/transt-stock'
        },
        {
          title: 'Dashboard Transfert',//ajouter
          icon: 'far fa-circle',
          route: '/dashboard-transt-stock'
        },
        {
          title: 'Fournisseur',
          icon: 'far fa-circle',
          route: '/fournisseur'
        },
        {
          title: 'Verouillage Stock',//aretirer
          icon: 'far fa-circle',
          route: '/verrouillage-stock'
        },
        {
          title: 'Pointe de Vente',
          icon: 'far fa-circle',
          route: '/point-vent'
        },
        {
          title: 'Commande Fournisseur',
          icon: 'far fa-circle',
          route: '/commande'
        },
        {
          title: 'Inventaire',
          icon: 'far fa-circle',
          route: '/inventaire-stock'
        },
        {
          title: 'Mise a jour du Stock',
          icon: 'far fa-circle',
          route: '/update-stock'
        },
        {
          title: 'Destockage',
          icon: 'far fa-circle',
          route: '/destockage'
        },
        {
          title: 'Static Stock',
          icon: 'far fa-circle',
          route: '/staticStock'
        },
        {
          title: 'Code Bare',
          icon: 'far fa-circle',
          route: '/code-bare-gestion'
        }

      ]
    },
    {
      title: 'Vente',
      icon: 'fas fa-shopping-bag',
      route: '',
      children: [
        {
          title: 'Vente Articles',
          icon: 'far fa-circle',
          route: '/vente-article'
        },
        {
          title: 'Vente Art./CodeBare',
          icon: 'far fa-circle',
          route: '/code-bare'
        },
        {
          title: 'Historique Caisse',
          icon: 'far fa-circle',
          route: '/historique-caisse'
        },
        {
          title: 'Controle Caisse',
          icon: 'far fa-circle',
          route: '/controle-caisse'
        },
        {
          title: 'Mode Paiement',
          icon: 'far fa-circle',
          route: '/mode-paiement'
        },
        {
          title: 'Bon D Achat',
          icon: 'far fa-circle',
          route: '/bon-achat'
        },

      ]
    },
    {
      title: 'Facturation',
      icon: 'fas fa-file-invoice-dollar',
      route: '',
      children: [
        {
          title: 'Client',
          icon: 'far fa-circle',
          route: '/clients'
        },
         {
          title: 'Devise Client',
          icon: 'far fa-circle',
          route: '/devis'
        },
        {
          title: 'Facture',
          icon: 'far fa-circle',
          route: '/factures'
        },
        {
          title: 'Versement',
          icon: 'far fa-circle',
          route: '/versements'
        },
         {
          title: 'Rapport',
          icon: 'far fa-circle',
          route: '/rapport'
        }
      ]
    },
    {
      title: 'Comptabilite',
      icon: 'fas fa-calculator',
      route: '',
      children: [
        {
          title: 'Type Resource',
          icon: 'far fa-circle',
          route: '/type-resource'
        },
        {
          title: 'Ressource',
          icon: 'far fa-circle',
          route: '/ressource'
        },
        {
          title: 'Historique vente',
          icon: 'far fa-circle',
          route: '/historique-vente'
        },
        {
          title: 'Controle Vente',
          icon: 'far fa-circle',
          route: '/controle-vente'
        },
        {
          title: 'Marge  Caisse',
          icon: 'far fa-circle',
          route: '/marge-caisse'
        },
        {
          title: 'Compte Client',
          icon: 'far fa-circle',
          route: '/compte-client'
        },
        {
          title: 'Charge',
          icon: 'far fa-circle',
          route: '/charge'
        },
        {
          title: 'Marge',
          icon: 'far fa-circle',
          route: '/marge'
        },
        {
          title: 'Type depense',
          icon: 'far fa-circle',
          route: '/type-depense'
        },
        {
          title: 'Element Ressource/Depense',
          icon: 'far fa-circle',
          route: '/element-ressource-depense'
        }

      ]
    },
    {
      title: 'Parametrage',
      icon: 'fas fa-tools',
      route: '',
      children: [
        {
          title: 'Annee',
          icon: 'far fa-circle',
          route: '/annee'
        },
        {
          title: 'Entreprise',
          icon: 'far fa-circle',
          route: '/entreprise'
        },
        {
          title: 'Boutique',
          icon: 'far fa-circle',
          route: '/boutique'
        },
        {
          title: 'Categorie Produit',
          icon: 'far fa-circle',
          route: '/categorie-produit'
        },
        {
          title: 'Specifique Produit',
          icon: 'far fa-circle',
          route: '/specifique-produit'
        },
        {
          title: 'Ville',
          icon: 'far fa-circle',
          route: '/ville'
        },
        {
          title: 'Magasin',
          icon: 'far fa-circle',
          route: '/magasin'
        },
        {
          title: 'Type client',
          icon: 'far fa-circle',
          route: '/type-client'
        }
      ]
    },
    {
      title: 'Photocophie',
      icon: 'fas fa-print',
      route: '',
      children: [

        {
          title: 'Photocopie/Saisir',
          icon: 'far fa-circle',
          route: '/photocopie'
        },
        {
          title: 'Historique Photocopie',
          icon: 'far fa-circle',
          route: '/historique-photocopie'
        },
      ]
    },
  ];
  // gestion de l existance des module pour un utilisateur precis
  getUserConnect(): string {
    let user: any;
    try {
      user = this.userService.getUserConnected().toPromise();
    } catch (error: unknown) {
      this.handleError(error, 'Erreur lors de la sauvegarde');
    }
    return user;
  }

  private handleError(error: unknown, defaultMessage: string): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        this.toastr.error("Le serveur est injoignable. Vérifiez qu'il est bien lancé.");
      } else {
        this.toastr.error(defaultMessage + ": " + (error.error?.message || 'inconnue'));
      }
    } else {
      this.toastr.error("Une erreur inattendue est survenue.");
      console.error('Erreur inconnue:', error);
    }
  }

  isHaveModuleSecurite(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'securite').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }
  isHaveModuleAdministration(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'administration').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }

  isHaveModuleStock(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'stock').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }
  isHaveModuleVente(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'vente').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }

  isHaveModuleFacturation(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'facturation').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module sécurité');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }

  isHaveModuleComptabilite(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'comptabilite').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }

  isHaveModuleParametrage(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'parametrage').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }

  isHaveModulePhotocopie(): Observable<boolean> {
    const usernames = this.getUserConnect();

    return this.moduleUserService.checkModuleUserExiste(usernames, 'photocopie').pipe(
      catchError((error: unknown) => {
        this.handleError(error, 'Erreur lors de la vérification du module ');
        return of(false); // Retourne false en cas d'erreur
      })
    );
  }
resultal(value: string):boolean{
  const hasUserModule = this.modules.some(module => this.transform(value).includes(module.code));
  if (!hasUserModule) { return false; }
  // licenceModulesActifs === null : pas de restriction de licence a appliquer
  // (SUPER_ADMIN/SYSTEM_ADMIN, ou echec du fetch - fail-open cote UI).
  if (this.licenceModulesActifs === null) { return true; }
  return this.licenceModulesActifs.has(this.transform(value));
}

resultalMenu(value: string, parentTitle?: string):boolean{
  // Un menu enfant ne doit jamais s'afficher si son groupe parent est deja masque
  // (droits utilisateur et/ou licence) - evite un enfant visible sans son parent.
  if (parentTitle && !this.resultal(parentTitle)) { return false; }
  // Egalite stricte (pas includes) : un code court comme "Client" ne doit pas
  // matcher un titre different qui le contient, ex. "Compte Client".
  return this.menuUsers.some(menu => menu.code === value);
}

transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toLowerCase() + value.slice(1);
  }


isExiste(value: string  ): Observable<boolean> {
  console.log(value)
  const status =this.getModuleStatusFromStringInsensitive(value);
  
  switch (status) {
    case ModuleStatus.SECURITE:
      return this.isHaveModuleSecurite().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module sécurité:', error);
          this.handleError(error, 'Erreur lors de la vérification du module sécurité');
          return of(false); // Retourne false en cas d'erreur
        })
      );
      
    case ModuleStatus.ADMINISTRATION:
      return this.isHaveModuleAdministration().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module administration:', error);
          this.handleError(error, 'Erreur lors de la vérification du module administration');
          return of(false);
        })
      );
      
    case ModuleStatus.STOCK:
      return this.isHaveModuleStock().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module stock:', error);
          this.handleError(error, 'Erreur lors de la vérification du module stock');
          return of(false);
        })
      );
      
    case ModuleStatus.VENTE:
      return this.isHaveModuleVente().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module vente:', error);
          this.handleError(error, 'Erreur lors de la vérification du module vente');
          return of(false);
        })
      );
      
    case ModuleStatus.PARAMETRAGE:
      return this.isHaveModuleParametrage().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module paramétrage:', error);
          this.handleError(error, 'Erreur lors de la vérification du module paramétrage');
          return of(false);
        })
      );
      
    case ModuleStatus.COMPTABILITE:
      return this.isHaveModuleComptabilite().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module comptabilité:', error);
          this.handleError(error, 'Erreur lors de la vérification du module comptabilité');
          return of(false);
        })
      );
      
    case ModuleStatus.PHOTOCOPIE:
      return this.isHaveModulePhotocopie().pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la vérification du module photocopie:', error);
          this.handleError(error, 'Erreur lors de la vérification du module photocopie');
          return of(false);
        })
      );
      
    default:
      console.warn(`Module non reconnu: ${status}`);
      return of(false);
  }
}

 getModuleStatusFromStringInsensitive(value: string): ModuleStatus | undefined {
 return (Object.values(ModuleStatus) as ModuleStatus[]).find(
    (status) => status.toLowerCase() === value.toLowerCase()
  );
}



isExiste3(value: string): boolean {
  console.log(value);
  let result = false; // Variable pour stocker le résultat
  
  try {
    const status = this.getModuleStatusFromStringInsensitive(value);
    
    if (!status) return false;
    
    // Map des méthodes correspondant à chaque status
    const moduleMethodMap = {
      [ModuleStatus.SECURITE]: () => this.isHaveModuleSecurite(),
      [ModuleStatus.ADMINISTRATION]: () => this.isHaveModuleAdministration(),
      [ModuleStatus.STOCK]: () => this.isHaveModuleStock(),
      [ModuleStatus.VENTE]: () => this.isHaveModuleVente(),
      [ModuleStatus.PARAMETRAGE]: () => this.isHaveModuleParametrage(),
      [ModuleStatus.COMPTABILITE]: () => this.isHaveModuleComptabilite(),
      [ModuleStatus.PHOTOCOPIE]: () => this.isHaveModulePhotocopie()
    };
    
    const moduleMethod = moduleMethodMap[status];
    
    if (!moduleMethod) {
      console.warn(`Module non reconnu: ${status}`);
      return false;
    }
    
    // Utiliser subscribe pour récupérer le résultat
    moduleMethod().pipe(
      catchError((error: any) => {
        console.error(`Erreur lors de la vérification du module:`, error);
        this.handleError(error, `Erreur lors de la vérification du module`);
        return of(false);
      })
    ).subscribe({
      next: (value: boolean) => {
        result = value || false; // Affecter le résultat
        console.log('Résultat reçu:', result);
      },
      error: (error: any) => {
        console.error('Erreur dans subscribe:', error);
        result = false;
      }
    });
    
    return result; // Retourner le résultat
    
  } catch (error) {
    console.error('Erreur dans isExiste:', error);
    return false;
  }
}
}
