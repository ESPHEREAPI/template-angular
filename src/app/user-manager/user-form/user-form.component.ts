import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profil } from '../../bookshoop/model/profil';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, CreateUserRequest } from '../../services/user.service';
import { ProfilService } from '../../services/profil.service';
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
  erreurSoumission: string | null = null;
  profils: Profil[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private profilService: ProfilService
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.loadProfils();

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
      username: ['', [Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', this.isEditMode ? [] : [Validators.required]],
      profilId: [null],
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
      .subscribe({
        next: (user) => {
          this.userForm.patchValue({
            username: user.userName,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastname,
            profilId: user.profilid,
            isActive: user.isActive
          });
        },
        error: (error) => {
          console.error('Error loading user', error);
          this.erreurSoumission = "Erreur lors du chargement de l'utilisateur.";
        }
      });
  }

  loadProfils(): void {
    this.profilService.getAllProfils().subscribe({
      next: (profils) => this.profils = profils,
      error: (error) => console.error('Error loading profils', error)
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.erreurSoumission = null;

    if (this.userForm.invalid) {
      return;
    }

    const formValue = this.userForm.value;
    const payload: CreateUserRequest = {
      userName: formValue.username?.trim() || undefined,
      firstName: formValue.firstName,
      lastname: formValue.lastName,
      password: formValue.password,
      email: formValue.email,
      profilid: formValue.profilId || undefined,
      isActive: formValue.isActive
    };

    this.loading = true;

    if (this.isEditMode && this.userId) {
      if (!payload.password) {
        delete (payload as any).password;
      }
      this.userService.updateUser(this.userId, payload)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => this.router.navigate(['/users']),
          error: (error) => {
            console.error('Error updating user', error);
            this.erreurSoumission = error?.error?.messageEcheck || error?.error?.message || "Erreur lors de la mise à jour de l'utilisateur.";
          }
        });
    } else {
      this.userService.createUser(payload)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => this.router.navigate(['/users']),
          error: (error) => {
            console.error('Error creating user', error);
            this.erreurSoumission = error?.error?.messageEcheck || error?.error?.message || "Erreur lors de la création de l'utilisateur.";
          }
        });
    }
  }

  // Getters pour faciliter l'accès aux champs du formulaire
  get f() { return this.userForm.controls; }
}
