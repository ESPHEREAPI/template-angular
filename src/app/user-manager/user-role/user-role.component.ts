import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Role } from '../../bookshoop/model/role';
import { RoleService } from '../../services/role.service';

/**
 * Liste des roles : une simple etiquette/categorie assignee a un
 * utilisateur (ex: Caissier, Commercial), plus la hierarchie systeme
 * (SUPER_ADMIN/SYSTEM_ADMIN/COMPANY_ADMIN, geree a part et non modifiable
 * ici). Les droits d'acces (Menu x Action) sont portes par le Profil, voir
 * UserProfilComponent.
 */
@Component({
  selector: 'app-user-role',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-role.component.html',
  styleUrl: './user-role.component.css'
})
export class UserRoleComponent implements OnInit {
  roles: Role[] = [];
  chargement = true;
  erreur = false;

  private readonly ROLES_SYSTEME = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'COMPANY_ADMIN'];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        // La hierarchie systeme est geree a part (acces code en dur cote
        // backend) - elle n'a pas sa place dans une liste de roles metier.
        this.roles = roles.filter(r => !this.ROLES_SYSTEME.includes(r.name));
        this.chargement = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des roles:', error);
        this.chargement = false;
        this.erreur = true;
      }
    });
  }
}
