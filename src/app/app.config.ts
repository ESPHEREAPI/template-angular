import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastrModule } from 'ngx-toastr';
import Aura from '@primeng/themes/aura';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { TokenInterceptor } from './auth/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configuration Angular
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    provideAnimationsAsync(),
    provideAnimations(),

    // Services PrimeNG
    MessageService,
    ConfirmationService,

    // Configuration PrimeNG
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false
        }
      },
      ripple: true,
    }),

    // Configuration Toastr
    importProvidersFrom(
      ToastrModule.forRoot({
        // Position
        positionClass: 'toast-top-left',
        
        // Durée d'affichage
        timeOut: 4000,
        extendedTimeOut: 2000,
        
        // Apparence
        progressBar: true,
        progressAnimation: 'increasing',
        closeButton: true,
        enableHtml: true,
        
        // Comportement
        tapToDismiss: true,
        preventDuplicates: true,
        resetTimeoutOnDuplicate: false,
        maxOpened: 3,
        autoDismiss: true,
        newestOnTop: true,
        
        // Classes CSS
        toastClass: 'ngx-toastr custom-toast',
        titleClass: 'toast-title',
        messageClass: 'toast-message',
        
        // Icônes
        iconClasses: {
          error: 'toast-error',
          info: 'toast-info',
          success: 'toast-success',
          warning: 'toast-warning'
        },
        
        // Animation
        easing: 'ease-in',
        easeTime: 300
      })
    ),

    // Localisation française
    { provide: LOCALE_ID, useValue: 'fr' }
  ]
}