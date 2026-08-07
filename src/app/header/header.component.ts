import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../services/login.service';
import { AuthService } from '../auth/auth.service';
import { Boutique } from '../bookshoop/model/boutique';
import { LicenceService } from '../bookshoop/service/licence.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
    @Input() boutique: Boutique | null = null;
    licenceJoursRestants: number | null = null;

constructor(private router:Router,public authenService: AuthService, private licenceService: LicenceService){}

  ngOnInit(): void {
    if (this.authenService.currentUserValue?.usersDTO?.role?.name === 'COMPANY_ADMIN') {
      this.licenceService.getMine().subscribe({
        next: (mine) => {
          if (mine.active?.dateExpiration) {
            const diff = new Date(mine.active.dateExpiration).getTime() - Date.now();
            this.licenceJoursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }
        },
        error: () => {}
      });
    }
  }

  onLogout(){
    this.authenService.logout();
    this.router.navigateByUrl('/login');

  }
}
