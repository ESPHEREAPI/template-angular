import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLteService } from '../services/admin-lte-service';
import { ContentHeaderComponent } from '../content-header/content-header.component';
import { AuthService } from '../auth/auth.service';
import { PlatformDashboardComponent } from './platform-dashboard/platform-dashboard.component';

const ROLES_SYSTEME = ['SUPER_ADMIN', 'SYSTEM_ADMIN'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ContentHeaderComponent, PlatformDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  pageTitle: string = 'Dashboard';
  breadcrumbItems = [
    { label: 'Home', route: '/dashboard' },
  { label: 'Dashboard', active: true }
  ];
  estCompteSysteme = false;

  constructor(private adminLteService: AdminLteService, private authService: AuthService)
{

}  ngOnInit(): void {
 const role = this.authService.currentUserValue?.usersDTO?.role?.name;
 this.estCompteSysteme = ROLES_SYSTEME.includes(role ?? '');

 // Initialiser les fonctionnalités AdminLTE après le chargement du composant
 setTimeout(() => {
  this.adminLteService.iniAdminLTE
}, 100)
  }

}
