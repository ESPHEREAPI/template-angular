import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumberToWordsService {
 convertToWords(amount: number): string {
    // Implémentation de la conversion nombre vers mots en français
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    if (amount === 0) return 'zéro';
    
    // Logique de conversion simplifiée
    // Cette fonction devrait être étendue pour gérer tous les cas
    return this.convertNumber(amount) + ' francs';
  }

  private convertNumber(num: number): string {
    // Implémentation simplifiée - à compléter selon les besoins
    if (num < 10) return ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'][num];
    // Ajouter la logique pour les nombres plus grands
    return num.toString();
  }
}
