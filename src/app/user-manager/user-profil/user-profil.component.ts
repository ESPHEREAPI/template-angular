import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profil } from '../../bookshoop/model/profil';
import { MenuActions } from '../../bookshoop/model/menu-actions';
import { ActionDTO } from '../../bookshoop/model/action';
import { ProfilService } from '../../services/profil.service';
import { AuthService } from '../../auth/auth.service';

interface ModuleGroupe {
  moduleId: number;
  moduleDescription: string;
  menus: MenuActions[];
}

/**
 * Administration de la matrice Profil x Menu x Action (voir
 * ProfilPermissionController cote backend). Un profil est selectionne, sa
 * matrice complete (tous les menus du catalogue) s'affiche, et chaque case
 * cochee/decochee bascule immediatement la permission correspondante.
 * C'est ce profil qui est ensuite assigne aux utilisateurs par le
 * COMPANY_ADMIN pour determiner leurs droits (le Role reste une simple
 * etiquette, voir UserRoleComponent).
 */
@Component({
  selector: 'app-user-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profil.component.html',
  styleUrl: './user-profil.component.css'
})
export class UserProfilComponent implements OnInit {
  // Catalogue dynamique (voir ActionController) - remplace l'ancienne liste
  // fixe ACTIONS_DISPONIBLES limitee a READ/WRITE/UPDATE/DELETE.
  actionsCatalogue: ActionDTO[] = [];
  actions: string[] = [];
  libelleAction: Record<string, string> = {};

  profils: Profil[] = [];
  selectedProfil: Profil | null = null;
  matrice: MenuActions[] = [];
  modulesGroupes: ModuleGroupe[] = [];
  chargementProfils = true;
  chargementMatrice = false;
  erreur = false;

  // Formulaire "nouveau profil"
  afficherFormulaireAjout = false;
  nouveauCode = '';
  nouvelleDescription = '';
  creationEnCours = false;
  erreurCreation: string | null = null;

  // Formulaire "nouvelle action" (SUPER_ADMIN/SYSTEM_ADMIN uniquement -
  // catalogue global, voir ActionController)
  afficherFormulaireAction = false;
  nouvelleActionCode = '';
  nouvelleActionLibelle = '';
  nouvelleActionDescription = '';
  creationActionEnCours = false;
  erreurCreationAction: string | null = null;

  // Duplication de profil
  profilEnDuplication: Profil | null = null;
  codeDuplication = '';
  duplicationEnCours = false;
  erreurDuplication: string | null = null;

  constructor(private profilService: ProfilService, private authService: AuthService) {}

  get peutGererActions(): boolean {
    const roleName = this.authService.currentUserValue?.usersDTO?.role?.name;
    return roleName === 'SUPER_ADMIN' || roleName === 'SYSTEM_ADMIN';
  }

  ngOnInit(): void {
    this.loadProfils();
    this.loadActions();
  }

  loadActions(): void {
    this.profilService.getActions().subscribe({
      next: (actions) => {
        this.actionsCatalogue = actions;
        this.actions = actions.map(a => a.code);
        this.libelleAction = Object.fromEntries(actions.map(a => [a.code, a.libelle]));
      },
      error: (error) => console.error('Erreur lors du chargement des actions:', error)
    });
  }

  loadProfils(): void {
    this.profilService.getAllProfils().subscribe({
      next: (profils) => {
        this.profils = profils;
        this.chargementProfils = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des profils:', error);
        this.chargementProfils = false;
        this.erreur = true;
      }
    });
  }

  selectionnerProfil(profil: Profil): void {
    this.selectedProfil = profil;
    this.chargementMatrice = true;
    this.profilService.getMatrice(profil.id).subscribe({
      next: (matrice) => {
        this.matrice = matrice;
        this.modulesGroupes = this.regrouperParModule(matrice);
        this.chargementMatrice = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la matrice:', error);
        this.chargementMatrice = false;
      }
    });
  }

  private regrouperParModule(matrice: MenuActions[]): ModuleGroupe[] {
    const groupes = new Map<number, ModuleGroupe>();
    for (const ligne of matrice) {
      if (!groupes.has(ligne.moduleId)) {
        groupes.set(ligne.moduleId, { moduleId: ligne.moduleId, moduleDescription: ligne.moduleDescription, menus: [] });
      }
      groupes.get(ligne.moduleId)!.menus.push(ligne);
    }
    return Array.from(groupes.values());
  }

  aLaction(menu: MenuActions, action: string): boolean {
    return menu.actions.includes(action);
  }

  basculerAction(menu: MenuActions, action: string): void {
    if (!this.selectedProfil) return;

    const accorde = !this.aLaction(menu, action);

    // Mise a jour optimiste de l'affichage
    if (accorde) {
      menu.actions.push(action);
    } else {
      menu.actions = menu.actions.filter(a => a !== action);
    }

    this.profilService.togglePermission({
      profilId: this.selectedProfil.id,
      menuId: menu.menuId,
      action,
      granted: accorde
    }).subscribe({
      error: (error) => {
        console.error('Erreur lors de la mise a jour de la permission:', error);
        // Annule la mise a jour optimiste en cas d'echec
        if (accorde) {
          menu.actions = menu.actions.filter(a => a !== action);
        } else {
          menu.actions.push(action);
        }
      }
    });
  }

  fermerMatrice(): void {
    this.selectedProfil = null;
    this.matrice = [];
    this.modulesGroupes = [];
  }

  basculerFormulaireAjout(): void {
    this.afficherFormulaireAjout = !this.afficherFormulaireAjout;
    this.erreurCreation = null;
    if (this.afficherFormulaireAjout) {
      this.nouveauCode = '';
      this.nouvelleDescription = '';
    }
  }

  creerProfil(): void {
    if (!this.nouveauCode.trim()) {
      this.erreurCreation = 'Le code du profil est obligatoire.';
      return;
    }

    this.creationEnCours = true;
    this.erreurCreation = null;

    this.profilService.createProfil(this.nouveauCode.trim().toUpperCase(), this.nouvelleDescription.trim()).subscribe({
      next: (profil) => {
        this.profils.push(profil);
        this.creationEnCours = false;
        this.afficherFormulaireAjout = false;
        this.selectionnerProfil(profil);
      },
      error: (error) => {
        console.error('Erreur lors de la creation du profil:', error);
        this.erreurCreation = error?.error?.message || 'Erreur lors de la création du profil (code déjà utilisé ?).';
        this.creationEnCours = false;
      }
    });
  }

  basculerFormulaireAction(): void {
    this.afficherFormulaireAction = !this.afficherFormulaireAction;
    this.erreurCreationAction = null;
    if (this.afficherFormulaireAction) {
      this.nouvelleActionCode = '';
      this.nouvelleActionLibelle = '';
      this.nouvelleActionDescription = '';
    }
  }

  creerAction(): void {
    if (!this.nouvelleActionCode.trim() || !this.nouvelleActionLibelle.trim()) {
      this.erreurCreationAction = 'Le code et le libellé sont obligatoires.';
      return;
    }

    this.creationActionEnCours = true;
    this.erreurCreationAction = null;

    this.profilService.createAction(
      this.nouvelleActionCode.trim().toUpperCase(),
      this.nouvelleActionLibelle.trim(),
      this.nouvelleActionDescription.trim()
    ).subscribe({
      next: () => {
        this.creationActionEnCours = false;
        this.afficherFormulaireAction = false;
        // Recharge le catalogue et, si une matrice est affichee, la matrice
        // du profil courant pour que la nouvelle colonne apparaisse tout de suite.
        this.loadActions();
        if (this.selectedProfil) {
          this.selectionnerProfil(this.selectedProfil);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la creation de l\'action:', error);
        this.erreurCreationAction = error?.error?.message || 'Erreur lors de la création de l\'action (code déjà utilisé ?).';
        this.creationActionEnCours = false;
      }
    });
  }

  ouvrirDuplication(profil: Profil, event: Event): void {
    event.stopPropagation();
    this.profilEnDuplication = profil;
    this.codeDuplication = '';
    this.erreurDuplication = null;
  }

  fermerDuplication(): void {
    this.profilEnDuplication = null;
    this.erreurDuplication = null;
  }

  confirmerDuplication(): void {
    if (!this.profilEnDuplication) return;
    if (!this.codeDuplication.trim()) {
      this.erreurDuplication = 'Le code du nouveau profil est obligatoire.';
      return;
    }

    this.duplicationEnCours = true;
    this.erreurDuplication = null;

    this.profilService.dupliquerProfil(
      this.profilEnDuplication.id,
      this.codeDuplication.trim().toUpperCase(),
      `Copie de ${this.profilEnDuplication.code}`
    ).subscribe({
      next: (copie) => {
        this.profils.push(copie);
        this.duplicationEnCours = false;
        this.profilEnDuplication = null;
        this.selectionnerProfil(copie);
      },
      error: (error) => {
        console.error('Erreur lors de la duplication du profil:', error);
        this.erreurDuplication = error?.error?.message || 'Erreur lors de la duplication (code déjà utilisé ?).';
        this.duplicationEnCours = false;
      }
    });
  }
}
