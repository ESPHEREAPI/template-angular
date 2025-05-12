import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-settings.component.html',
  styleUrl: './security-settings.component.css'
})
export class SecuritySettingsComponent implements OnInit{


  securitySettings = {
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionTimeoutMinutes: 60,
    twoFactorAuthRequired: false,
    allowedIpAddresses: '',
    blockedIpAddresses: '',
    enableCaptcha: true
  };

  passwordStrengthLevels = [
    { value: 'weak', name: 'Faible' },
    { value: 'medium', name: 'Moyen' },
    { value: 'strong', name: 'Fort' },
    { value: 'very-strong', name: 'Très fort' }
  ];
  saveSuccess: boolean = false;
  currentPasswordStrength: string = 'medium';

  constructor() { }
  ngOnInit(): void {
    this.calculatePasswordStrength();
  }
  calculatePasswordStrength(): void {
    let score = 0;
    
    // Calculer le score basé sur les critères activés
    if (this.securitySettings.passwordMinLength >= 8) score++;
    if (this.securitySettings.passwordMinLength >= 12) score++;
    if (this.securitySettings.requireUppercase) score++;
    if (this.securitySettings.requireLowercase) score++;
    if (this.securitySettings.requireNumbers) score++;
    if (this.securitySettings.requireSpecialChars) score++;
    
    // Définir le niveau de force du mot de passe
    if (score <= 2) {
      this.currentPasswordStrength = 'weak';
    } else if (score <= 4) {
      this.currentPasswordStrength = 'medium';
    } else if (score <= 5) {
      this.currentPasswordStrength = 'strong';
    } else {
      this.currentPasswordStrength = 'very-strong';
    }
  }

  getPasswordStrengthClass(): string {
    switch (this.currentPasswordStrength) {
      case 'weak': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'strong': return 'bg-success';
      case 'very-strong': return 'bg-success';
      default: return 'bg-warning';
    }
  }

  updatePasswordCriteria(): void {
    this.calculatePasswordStrength();
  }

  saveSettings(): void {
    // Simulation d'une requête API
    setTimeout(() => {
      // Simulation de succès
      this.saveSuccess = true;
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        this.saveSuccess = false;
      }, 3000);
      
      console.log('Security settings saved:', this.securitySettings);
    }, 800);
  }

  resetToDefaults(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres de sécurité ?')) {
      this.securitySettings = {
        passwordMinLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiryDays: 90,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 30,
        sessionTimeoutMinutes: 60,
        twoFactorAuthRequired: false,
        allowedIpAddresses: '',
        blockedIpAddresses: '',
        enableCaptcha: true
      };
      
      this.calculatePasswordStrength();
    }
  }
}
