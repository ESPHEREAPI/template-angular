import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Roles } from '../../model/roles';
import { Permissions } from '../../model/permissions';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-role',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './user-role.component.html',
  styleUrl: './user-role.component.css'
})
export class UserRoleComponent {
  roleForm: FormGroup;
  roles: Roles[] = [];
  permissions: Permissions[] = [];
  selectedRole: Roles | null = null;
  selectedPermissions: Permissions[] = [];
  editMode = false;

  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: [''],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }
  loadRoles(): void {
    // Ici, vous feriez normalement un appel API
    // Pour l'exemple, nous utilisons des données statiques
    this.roles = [
      {
        id: 1,
        name: 'Administrateur',
        description: 'Accès complet à toutes les fonctionnalités',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: []
      },
      {
        id: 2,
        name: 'Utilisateur',
        description: 'Accès limité aux fonctionnalités de base',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: []
      }
    ];
  }

  loadPermissions(): void {
    // Ici, vous feriez normalement un appel API
    // Pour l'exemple, nous utilisons des données statiques
    this.permissions = [
      {
        id: 1,
        code: 'USER_VIEW',
        name: 'Voir les utilisateurs',
        description: 'Permet de visualiser la liste des utilisateurs',
        module: 'Utilisateurs'
      },
      {
        id: 2,
        code: 'USER_CREATE',
        name: 'Créer un utilisateur',
        description: 'Permet de créer un nouvel utilisateur',
        module: 'Utilisateurs'
      },
      {
        id: 3,
        code: 'USER_EDIT',
        name: 'Modifier un utilisateur',
        description: 'Permet de modifier les informations d\'un utilisateur',
        module: 'Utilisateurs'
      },
      {
        id: 4,
        code: 'USER_DELETE',
        name: 'Supprimer un utilisateur',
        description: 'Permet de supprimer un utilisateur',
        module: 'Utilisateurs'
      },
      {
        id: 5,
        code: 'ROLE_VIEW',
        name: 'Voir les rôles',
        description: 'Permet de visualiser la liste des rôles',
        module: 'Rôles'
      },
      {
        id: 6,
        code: 'ROLE_CREATE',
        name: 'Créer un rôle',
        description: 'Permet de créer un nouveau rôle',
        module: 'Rôles'
      },
      {
        id: 7,
        code: 'ROLE_EDIT',
        name: 'Modifier un rôle',
        description: 'Permet de modifier un rôle',
        module: 'Rôles'
      },
      {
        id: 8,
        code: 'ROLE_DELETE',
        name: 'Supprimer un rôle',
        description: 'Permet de supprimer un rôle',
        module: 'Rôles'
      }
    ];
  }

  onRoleSubmit(): void {
    if (this.roleForm.invalid) {
      return;
    }

    const roleData: Roles = {
      ...this.roleForm.value
    };

    if (this.editMode && roleData.id) {
      // Mise à jour d'un rôle existant
      const index = this.roles.findIndex(r => r.id === roleData.id);
      if (index !== -1) {
        this.roles[index] = { ...this.roles[index], ...roleData };
      }
      console.log('Rôle mis à jour:', roleData);
    } else {
      // Ajout d'un nouveau rôle
      const newId = Math.max(...this.roles.map(r => r.id || 0), 0) + 1;
      const newRole: Roles = {
        ...roleData,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: []
      };
      this.roles.push(newRole);
      console.log('Nouveau rôle ajouté:', newRole);
    }

    this.resetRoleForm();
  }

  resetRoleForm(): void {
    this.roleForm.reset({ isDefault: false });
    this.editMode = false;
  }

  editRole(role: Roles): void {
    this.editMode = true;
    this.roleForm.patchValue({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault
    });
  }

  deleteRole(id?: number): void {
    if (!id) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      this.roles = this.roles.filter(r => r.id !== id);
      console.log('Rôle supprimé, ID:', id);
    }
  }

  managePermissions(role: Roles): void {
    this.selectedRole = { ...role };
    // Charger les permissions existantes pour ce rôle
    const roleWithPermissions = this.roles.find(r => r.id === role.id);
    this.selectedPermissions = [...(roleWithPermissions?.permissions || [])];
  }

  getUniqueModules(): string[] {
    return [...new Set(this.permissions.map(p => p.module))];
  }

  getPermissionsByModule(module: string): Permissions[] {
    return this.permissions.filter(p => p.module === module);
  }

  isPermissionSelected(permission: Permissions): boolean {
    return this.selectedPermissions.some(p => p.id === permission.id);
  }

  togglePermission(permission: Permissions): void {
    const index = this.selectedPermissions.findIndex(p => p.id === permission.id);
    
    if (index === -1) {
      // Ajouter la permission
      this.selectedPermissions.push(permission);
    } else {
      // Retirer la permission
      this.selectedPermissions.splice(index, 1);
    }
  }

  saveRolePermissions(): void {
    if (!this.selectedRole || !this.selectedRole.id) return;

    // Trouver l'index du rôle sélectionné
    const roleIndex = this.roles.findIndex(r => r.id === this.selectedRole?.id);
    if (roleIndex !== -1) {
      // Mettre à jour les permissions du rôle
      this.roles[roleIndex].permissions = [...this.selectedPermissions];
      this.roles[roleIndex].updatedAt = new Date();
      console.log('Permissions mises à jour pour le rôle:', this.roles[roleIndex]);
    }

    this.cancelPermissionEdit();
  }

  cancelPermissionEdit(): void {
    this.selectedRole = null;
    this.selectedPermissions = []
}

}
