import { Component, OnInit } from '@angular/core';
import { AdminLteService } from '../services/admin-lte-service';
import { ContentHeaderComponent } from '../content-header/content-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ContentHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  pageTitle: string = 'Dashboard';
  breadcrumbItems = [
    { label: 'Home', route: '/dashboard' },
  { label: 'Dashboard', active: true }
  ];
  constructor(private adminLteService: AdminLteService)
{

}  ngOnInit(): void {
 // Initialiser les fonctionnalités AdminLTE après le chargement du composant
 setTimeout(() => {
  this.adminLteService.iniAdminLTE
}, 100)
  }

}
