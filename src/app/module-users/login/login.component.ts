import { Component, ViewChild } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
import{ Users} from '../../model/Users'
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessagesModule } from 'primeng/messages';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserSession } from '../../model/user-session';
import { Boutique } from '../../bookshoop/model/boutique';
import { BoutiqueSelectionDialogComponent } from '../../bookshoop/compoment/boutique-selection-dialog.component';
import { LicenceService } from '../../bookshoop/service/licence.service';




@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ToastModule,MessagesModule,CommonModule,FormsModule, BoutiqueSelectionDialogComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @ViewChild (BoutiqueSelectionDialogComponent) boutiqueDialog!: BoutiqueSelectionDialogComponent;
  
  userSession: any;
  user: any;
  errorMessage!: string;

  constructor(
    public loginService: LoginService,
    private router: Router,
    private messageService: MessageService,
    private authentificationService: AuthService,
    private licenceService: LicenceService
  ) {}

  ngOnInit(): void {
    // Vérifier si déjà connecté
    if (this.authentificationService.isLoggedIn()) {
      console.log('[LoginComponent] User already logged in, redirecting...');
      this.router.navigateByUrl('dashboard');
    }
  }

  onLogin(dataForm: any) {
    console.log('[LoginComponent] Login attempt for:', dataForm.username);

    this.authentificationService.login(dataForm.username, dataForm.password).subscribe({
      next: (data: UserSession) => {
        console.log('[LoginComponent] Login successful:', data);
        
        this.userSession = data;
        this.user = this.userSession.usersDTO;

        // Mot de passe assigne (creation ou reinitialisation) : changement
        // obligatoire avant tout acces, quel que soit le profil.
        if (this.userSession?.mustChangePassword) {
          console.log('[LoginComponent] Changement de mot de passe requis');
          this.router.navigateByUrl('change-password');
          return;
        }

        // Vérifier l'état de connexion de l'utilisateur
        if (this.user != undefined && this.user?.echeck_connection === false) {

          // Vérifier si le profil nécessite la sélection d'une boutique
          if (this.authentificationService.requiresBoutiqueSelection(this.userSession)) {
            console.log('[LoginComponent] Profil nécessite sélection de boutique');
        
            // Ouvrir le dialogue de sélection de boutique
            this.openBoutiqueDialog();
            
          } else {
            // Pour les autres profils, continuer normalement
            console.log('[LoginComponent] Profil ne nécessite pas de boutique, redirection...');
            this.proceedToNextStep();
          }
          
        } else {
          // Erreur de connexion
          this.messageService.add({
            severity: 'error',
            summary: 'Authentification ERROR',
            detail: this.user?.messageEcheck || 'Erreur lors de la connexion'
          });
          this.router.navigateByUrl('login');
        }
      },
      error: err => {
        console.error('[LoginComponent] Login error:', err);
        // Identifiants invalides/compte inactif (401) : messageEcheck vient du
        // corps de la reponse parse par AuthService (voir parsedBody).
        this.errorMessage = err?.parsedBody?.messageEcheck || err.message || 'Erreur de connexion';
        this.messageService.add({
          severity: 'error',
          summary: 'Authentification ERROR',
          detail: this.errorMessage
        });
      }
    });
  }

  /**
   * Ouvre le dialogue de sélection de boutique
   */
  private openBoutiqueDialog(): void {
    console.log('[LoginComponent] Opening boutique selection dialog');
    
    // Attendre que le ViewChild soit initialisé
    setTimeout(() => {
      if (this.boutiqueDialog) {
        this.boutiqueDialog.open((boutique: Boutique) => {
          this.onBoutiqueSelected(boutique);
        });
      } else {
        console.error('[LoginComponent] BoutiqueDialog not found');
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'ouvrir le dialogue de sélection'
        });
      }
    }, 100);
  }

  /**
   * Callback appelé quand une boutique est sélectionnée
   */
  private onBoutiqueSelected(boutique: Boutique): void {
    console.log('[LoginComponent] Boutique selected:', boutique);
    
    // Affecter la boutique à l'utilisateur
    this.authentificationService.assignBoutique(boutique.id??0);
    
    // Afficher un message de confirmation
    this.messageService.add({
      severity: 'success',
      summary: 'Boutique sélectionnée',
      detail: `Vous êtes connecté à la boutique: ${boutique.nom}`
    });
    
    // Continuer vers le dashboard
    this.proceedToNextStep();
  }

  /**
   * Continue vers l'étape suivante après authentification
   */
  private proceedToNextStep(): void {
    console.log('[LoginComponent] Proceeding to next step');
    console.log('[LoginComponent] IsLoggedIn:', this.authentificationService.isLoggedIn());
    
    if (this.authentificationService.isLoggedIn() === true) {
      const role = this.authentificationService.currentUserValue?.usersDTO?.role?.name;
      if (role === 'COMPANY_ADMIN') {
        this.licenceService.getMine().subscribe({
          next: (mine) => {
            if (!mine.active) {
              console.log('[LoginComponent] Pas de licence active, redirection vers Mes Licences');
              this.router.navigateByUrl('compagnie/mes-licences');
            } else {
              this.router.navigateByUrl('dashboard');
            }
          },
          error: () => this.router.navigateByUrl('dashboard')
        });
        return;
      }
      console.log('[LoginComponent] Redirecting to dashboard');
      this.router.navigateByUrl('dashboard');
    } else {
      console.error('[LoginComponent] Login verification failed');
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de la validation de la connexion'
      });
    }
  }
}
