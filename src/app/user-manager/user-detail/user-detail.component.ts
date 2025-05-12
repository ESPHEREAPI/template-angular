import { Component, OnInit } from '@angular/core';
import { User } from '../../model/user';
import { Roles } from '../../model/roles';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule,
    ReactiveFormsModule,NgxPaginationModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit{

  user: User | null = null;
  userId: number | null = null;
  loading = false;
  role: Roles | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = +id;
      this.loadUser(this.userId);
    } else {
      this.error = 'User ID not provided';
    }
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getUserById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.loadUserRole(user.roleId);
        },
        error: (error) => {
          console.error('Error loading user', error);
          this.error = 'Error loading user details';
        }
      });
  }

  loadUserRole(roleId: number): void {
    this.roleService.getRoleById(roleId).subscribe({
      next: (role) => {
        this.role = role;
      },
      error: (error) => {
        console.error('Error loading role', error);
        // Just log error, not critical for page display
      }
    });
  }

  onEdit(): void {
    if (this.userId) {
      this.router.navigate(['/users', this.userId, 'edit']);
    }
  }

  onDelete(): void {
    if (!this.userId) return;

    if (confirm('Are you sure you want to delete this user?')) {
      this.loading = true;
      this.userService.deleteUser(this.userId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            // Navigate back to users list
            this.router.navigate(['/users']);
          },
          error: (error) => {
            console.error('Error deleting user', error);
            this.error = 'Error deleting user';
          }
        });
    }
  }

  onBack(): void {
    this.router.navigate(['/users']);
  }
}
