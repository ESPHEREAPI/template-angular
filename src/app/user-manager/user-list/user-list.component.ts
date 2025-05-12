import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { User } from '../../model/user';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule,
  ReactiveFormsModule,NgxPaginationModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit{

  users: User[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;
  loading = false;
  searchTerm = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(this.currentPage, this.itemsPerPage, this.searchTerm)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        response => {
          this.users = response.data;
          this.totalItems = response.total;
        },
        error => {
          console.error('Error loading users', error);
          // Afficher une notification d'erreur
        }
      );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onSearch(): void {
    this.currentPage = 1; // Réinitialiser à la première page lors d'une recherche
    this.loadUsers();
  }

  onResetSearch(): void {
    this.searchTerm = '';
    this.loadUsers();
  }

  hasEditPermission(): boolean {
    return this.authService.hasPermission('users.edit');
  }

  hasDeletePermission(): boolean {
    return this.authService.hasPermission('users.delete');
  }

  editUser(userId: number): void {
    this.router.navigate(['/users/edit', userId]);
  }

  viewUserDetails(userId: number): void {
    this.router.navigate(['/users/detail', userId]);
  }

  activateUser(userId: number, event: Event): void {
    event.stopPropagation();
    this.userService.activateUser(userId)
      .subscribe(
        () => {
          // Mettre à jour l'utilisateur dans la liste
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.isActive = true;
          }
          // Afficher une notification de succès
        },
        error => {
          console.error('Error activating user', error);
          // Afficher une notification d'erreur
        }
      );
  }

  deactivateUser(userId: number, event: Event): void {
    event.stopPropagation();
    this.userService.deactivateUser(userId)
      .subscribe(
        () => {
          // Mettre à jour l'utilisateur dans la liste
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.isActive = false;
          }
          // Afficher une notification de succès
        },
        error => {
          console.error('Error deactivating user', error);
          // Afficher une notification d'erreur
        }
      );
  }

  deleteUser(userId: number, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(userId)
        .subscribe(
          () => {
            // Supprimer l'utilisateur de la liste
            this.users = this.users.filter(u => u.id !== userId);
            // Afficher une notification de succès
          },
          error => {
            console.error('Error deleting user', error);
            // Afficher une notification d'erreur
          }
        );
    }
  }
}
