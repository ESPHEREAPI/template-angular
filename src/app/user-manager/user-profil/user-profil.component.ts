import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profil } from '../../bookshoop/model/profil';
import { MenuActions } from '../../bookshoop/model/menu-actions';
import { ProfilService } from '../../services/profil.service';

const ACTIONS_DISPONIBLES = ['READ', 'WRITE', 'UPDATE', 'DELETE', 'PRINT'];
const LIBELLE_ACTION: Record<string, string> = {
  READ: 'Voir',
  WRITE: 'Ajouter',
  UPDATE: 'Modifier',
  DELETE: 'Supprimer',
  PRINT: 'Imprimer'
};

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
  actions = ACTIONS_DISPONIBLES;
  libelleAction = LIBELLE_ACTION;

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

  constructor(private profilService: ProfilService) {}

  ngOnInit(): void {
    this.loadProfils();
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
}
