import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormatService {
/**
   * Formate un nombre avec les paramètres locaux français
   */
  formatNumberGeneral(value: number): string {
    if (value === null || value === undefined) {
      return '0';
    }
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Formate un prix avec devise
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(value);
  }
}
