import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  currentUrl: string = '';
  countdown: number = 10;
  countdownInterval: any;

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    this.location.back();
  }

  reportIssue(): void {
    // Logique pour signaler un problème
    const subject = encodeURIComponent('Page non trouvée - Rapport d\'erreur');
    const body = encodeURIComponent(`
      Bonjour,
      
      J'ai rencontré une erreur 404 sur votre site.
      URL concernée: ${this.currentUrl}
      Date: ${new Date().toLocaleString()}
      
      Cordialement
    `);
    
    window.open(`mailto:support@votresite.com?subject=${subject}&body=${body}`);
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.goHome();
      }
    }, 1000);
  }

  stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
