import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuActions } from '../../bookshoop/model/menu-actions';
import { ProfilService } from '../../services/profil.service';

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
 * Catalogue de reference Module -> Menu -> Actions disponibles (lecture
 * seule, independant de tout profil) - permet a un administrateur de voir
 * la structure complete du systeme avant de configurer des profils (voir
 * UserProfilComponent, qui accorde les actions par profil).
 */
@Component({
  selector: 'app-module-securite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-securite.component.html',
  styleUrl: './module-securite.component.css'
})
export class ModuleSecuriteComponent implements OnInit {
  libelleAction = LIBELLE_ACTION;
  modulesGroupes: ModuleGroupe[] = [];
  chargement = true;
  erreur = false;

  constructor(private profilService: ProfilService) {}

  ngOnInit(): void {
    this.profilService.getCatalogue().subscribe({
      next: (catalogue) => {
        this.modulesGroupes = this.regrouperParModule(catalogue);
        this.chargement = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du catalogue:', error);
        this.chargement = false;
        this.erreur = true;
      }
    });
  }

  private regrouperParModule(catalogue: MenuActions[]): ModuleGroupe[] {
    const groupes = new Map<number, ModuleGroupe>();
    for (const ligne of catalogue) {
      if (!groupes.has(ligne.moduleId)) {
        groupes.set(ligne.moduleId, { moduleId: ligne.moduleId, moduleDescription: ligne.moduleDescription, menus: [] });
      }
      groupes.get(ligne.moduleId)!.menus.push(ligne);
    }
    return Array.from(groupes.values());
  }
}
