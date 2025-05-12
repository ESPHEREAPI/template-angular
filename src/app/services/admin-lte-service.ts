import { Injectable } from '@angular/core';

import  $ from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class AdminLteService {
 // declare const $: any;
  constructor() { }
  iniAdminLTE():void {
    // Ce service permet d'initialiser les fonctionnalités JS d'AdminLTE
    // quand nécessaire après le chargement de composants dynamiques
    
    // Par exemple, réinitialiser les cartes (cards) après navigation
    if ($.fn.bootstrapCards) {
      $('.card').bootstrapCards();
    }
    
    // Initialiser les widgets et autres fonctionnalités
    if (typeof $.fn.overlayScrollbars !== 'undefined') {
      $('[data-widget="scrollbar"]').overlayScrollbars({
        // Options ici
      });
    }
  }
  }

