import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './general-settings.component.html',
  styleUrl: './general-settings.component.css'
})
export class GeneralSettingsComponent implements OnInit{
  settings = {
    siteName: 'Mon Application AdminLTE',
    siteDescription: 'Une application basée sur AdminLTE et Angular',
    adminEmail: 'admin@example.com',
    postsPerPage: 10,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Europe/Paris',
    language: 'fr',
    enableRegistration: true,
    requireEmailActivation: true,
    maintenanceMode: false
  };

  
  timezones = [
    'UTC',
    'Europe/Paris',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Africa/Cairo'
  ];

  languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' }
  ];

  dateFormats = [
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD'
  ];

  timeFormats = [
    '12h',
    '24h'
  ];

  saveSuccess: boolean = false;
  saveError: boolean = false;

  constructor() { }
  ngOnInit(): void {
   // throw new Error('Method not implemented.');
  }

  saveSettings(): void {
    // Simulation d'une requête API
    setTimeout(() => {
      // Simulation de succès (en production, ce serait après une réponse API réussie)
      this.saveSuccess = true;
      this.saveError = false;

      // Masquer le message après 3 secondes
      setTimeout(() => {
        this.saveSuccess = false;
      }, 3000);

      console.log('Settings saved:', this.settings);
    }, 800);
  }

  resetSettings(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      // Réinitialiser aux valeurs par défaut
      this.settings = {
        siteName: 'Mon Application AdminLTE',
        siteDescription: 'Une application basée sur AdminLTE et Angular',
        adminEmail: 'admin@example.com',
        postsPerPage: 10,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h', 
        timezone: 'Europe/Paris',
        language: 'fr',
        enableRegistration: true,
        requireEmailActivation: true,
        maintenanceMode: false
      };
    }
  }

  toggleMaintenanceMode(): void {
    if (this.settings.maintenanceMode) {
      if (confirm('Désactiver le mode maintenance ?')) {
        this.settings.maintenanceMode = false;
      }
    } else {
      if (confirm('Activer le mode maintenance ? Le site sera inaccessible aux utilisateurs non-administrateurs.')) {
        this.settings.maintenanceMode = true;
      }
    }
  }

}
