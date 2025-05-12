import { Component, OnInit } from '@angular/core';
import { error } from 'jquery';
import { finalize } from 'rxjs';
import { User } from '../../model/user';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Roles } from '../../model/roles';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule,
    ReactiveFormsModule,NgxPaginationModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {

  userForm: FormGroup;
  userId: number | null = null;
  isEditMode = false;
  loading = false;
  submitted = false;
  roles: Roles[] = [];
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.loadRoles();
    
    // Vérifier s'il s'agit d'un mode d'édition
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = +id;
      this.isEditMode = true;
      this.loadUser(this.userId);
    }
  }

  createUserForm(): FormGroup {
    return this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', this.isEditMode ? [] : [Validators.required]],
      roleId: [null, Validators.required],
      isActive: [true]
    }, {
      validators: this.isEditMode ? [] : this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const passwordConfirm = group.get('passwordConfirm')?.value;
    
    if (password && passwordConfirm && password !== passwordConfirm) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getUserById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        user => {
          // Supprimer les champs de mot de passe en mode édition
          const { password, ...userWithoutPassword } = user;
          
          this.userForm.patchValue({
            ...userWithoutPassword,
            roleId: user.roleId
          });
        },
        error => {
          console.error('Error loading user', error);
          // Afficher une notification d'erreur
        }
      );
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe(
      roles => {
        this.roles = roles;
      },
      error => {
        console.error('Error loading roles', error);
        // Afficher une notification d'erreur
      }
    );
  }

  onSubmit(): void {
    this.submitted = true;
    
    // Arrêter ici si le formulaire est invalide
    if (this.userForm.invalid) {
      return;
    }

    // Préparer les données utilisateur
    const userData: User = this.userForm.value;
    
    // Supprimer la confirmation du mot de passe
    if ('passwordConfirm' in userData) {
      delete (userData as any).passwordConfirm;
    }
    
    // Si on est en mode édition et que le mot de passe est vide, on le supprime
    if (this.isEditMode && !userData.password) {
      delete userData.password;
    }

    this.loading = true;
    
    if (this.isEditMode && this.userId) {
      // Mettre à jour l'utilisateur existant
      this.userService.updateUser(this.userId, userData)
        .pipe(finalize(() => this.loading = false))
        .subscribe(
          user => {
            // Afficher une notification de succès
            this.router.navigate(['/users']);
          },
          error => {
            console.error('Error updating user', error);
            // Afficher une notification d'erreur
          }
        );
    } else {
      // Créer un nouvel utilisateur
      this.userService.createUser(userData)
        .pipe(finalize(() => this.loading = false))
        .subscribe(
          user => {
            // Afficher une notification de succès
            this.router.navigate(['/users']);
          },
          error => {
            console.error('Error creating user', error);
            // Afficher une notification d'erreur
          }
        );
    }
  }

  // Getters pour faciliter l'accès aux champs du formulaire
  get f() { return this.userForm.controls; }
}
