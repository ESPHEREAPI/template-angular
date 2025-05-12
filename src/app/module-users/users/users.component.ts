import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Users } from '../../model/Users';
import { ContentHeaderComponent } from '../../content-header/content-header.component';
import { AdminLteService } from '../../services/admin-lte-service';


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ContentHeaderComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: Users[] = [];
  filteredUsers: Users[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  pageTitle: string = 'Gestion Des utilisateurs';
  breadcrumbItems = [
    { label: 'Accueil', route: '/dashboard' },
    { label: 'Utilisateurs', active: true }
  ];
  constructor(private adminLteService: AdminLteService) { }
  ngOnInit(): void {
    // Initialiser les fonctionnalités AdminLTE après le chargement du composant
    setTimeout(() => {
      this.adminLteService.iniAdminLTE
    }, 100);

    // Simulation de données utilisateurs
    this.users = this.generateMockUsers(50);
    this.filteredUsers = [...this.users];
    this.totalItems = this.filteredUsers.length;
  }

  generateMockUsers(count: number): Users[] {
    const roles = ['Admin', 'Manager', 'Editor', 'User'];
    const statuses: ('active' | 'inactive')[] = ['active', 'inactive'];
    const echeckMessages = ['Réussi', 'Échoué: Mot de passe incorrect', 'Échoué: Compte verrouillé', ''];
    const mockUsers: Users[] = [];

    for (let i = 1; i <= count; i++) {
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomDate = new Date(
        Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365)
      );
      const randomMessageEcheck = echeckMessages[Math.floor(Math.random() * echeckMessages.length)];
      const randomEcheckConnection = Math.random() > 0.5;
      mockUsers.push({
        id: i,
        nom: `Utilisateur ${i}`,
        email: `user${i}@example.com`,
        roles: randomRole,
        status: randomStatus,
        registeredDate: randomDate,
        messageEcheck: randomMessageEcheck,
        echeck_connection: randomEcheckConnection,
        login: 'login',
        password: 'password',
        type: 'type',
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        profileImageUrl: "",
        active: !randomStatus,
        roless: []
      });
    }

    return mockUsers;
  }

  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredUsers = this.users.filter(user =>
        user.nom.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
        //||
        //user.roles.toLowerCase().includes(term)
      );
    }
    this.totalItems = this.filteredUsers.length;
    this.currentPage = 1;
  }

  getPaginatedUsers(): Users[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  deleteUser(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.users = this.users.filter(user => user.id !== id);
      this.searchUsers(); // Refresh filtered list
    }
  }

  toggleStatus(user: Users): void {
    user.status = user.status === 'active' ? 'inactive' : 'active';
  }
  // Ajouter cette méthode au composant
  getDisplayedRange(): { start: number, end: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return { start, end };
  }
}
