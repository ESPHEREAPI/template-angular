import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//import { AdminLayoutComponentComponent } from "./admin-layout.component/admin-layout.component.component";
import { PrimeNG } from 'primeng/config';
import { HealthResponse } from './bookshoop/model/HealthResponse';
import { HealthService } from './services/HealthService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  healthStatus: HealthResponse | null = null;
  constructor(private primeng: PrimeNG,private healthService: HealthService) { }
  ngOnInit(): void {
    this.primeng.ripple.set(true);
    this.healthService.checkHealth().subscribe({
      next: (data) => {
        this.healthStatus = data;
        console.log('Health check:', data);
      },
      error: (error) => {
        console.error('Erreur lors du health check:', error);
      }
    });
  }
  
  title = 'adminlte-angular-app';
  
}
