import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Order } from '../../model/Order';
import { Caddy } from '../../model/Caddy';
import { CaddyService } from '../../service/caddy.service';
import { OrdersService } from '../../service/orders.service';
import { MessageService } from 'primeng/api';
import { LoginService } from '../../service/login.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BlockUIModule } from 'primeng/blockui';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { UsernameCacheService } from '../../service/username-cache.service';
import { UserService } from '../../service/user-service.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    RouterModule, 
    BlockUIModule, 
    ToastModule, 
    ButtonModule,
    ProgressSpinnerModule
  ],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  order: Order = new Order();
  caddie!: Caddy;
  blockedDocument: boolean = false;
  controle_btn: boolean = false;
  errorMessage!: string;
  username: string = '';
  usernameValide: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private usernameCacheService: UsernameCacheService, 
    private router: Router, 
    private caddyService: CaddyService, 
    private ordersService: OrdersService, 
    private messageService: MessageService, 
    private loginService: UserService
  ) {
    this.initializeCaddy();
  }

  ngOnInit(): void {
    this.initializeUsername();
  }

  private initializeCaddy(): void {
    const caddyData = localStorage.getItem("caddy");
    if (caddyData) {
      try {
        this.caddie = JSON.parse(caddyData);
        this.chargeOrder(this.caddie);
      } catch (error) {
        console.error('Erreur lors du parsing du caddy:', error);
        this.showError('Erreur de données', 'Les données du panier sont corrompues.');
      }
    }
  }

  private initializeUsername(): void {
    const username = this.usernameCacheService.getCachedUsername();
    if (username) {
      this.username = username;
      if (this.usernameCacheService.isUsernameValid(this.username)) {
        this.usernameValide = true;
        this.order.client.usernane = this.username;
      }
    }
  }

  public chargeOrder(caddy: Caddy): void {
    if (!caddy) return;

    this.order.date = new Date();
    
    if (!this.order.client) {
      this.order.client = {
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        usernane: ''
      };
    }

    this.order.client.name = `${caddy.client.name ?? 'Client'}_${this.order.date.getTime()}`;
    this.order.id = 0;
    this.order.products = caddy.itemsProducts;
    this.order.totalAmount = this.caddyService.getTotal();
  }

  verifierUsername(): void {
    if (this.usernameValide || !this.username || this.username.trim() === '') {
      if (!this.username || this.username.trim() === '') {
        this.usernameValide = false;
      }
      return;
    }

    this.isLoading = true;

    this.loginService.checkUsername(this.username).subscribe({
      next: (result: boolean) => {
        this.isLoading = false;
        if (result) {
          this.usernameValide = true;
          this.order.client.usernane = this.username;
          this.usernameCacheService.saveValidUsername(this.username);
          this.showSuccess('Validation réussie', 'Nom d\'utilisateur validé avec succès.');
        } else {
          this.usernameValide = false;
          this.showError('Nom utilisateur invalide', 'Aucun utilisateur avec ce nom n\'a été trouvé.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.usernameValide = false;
        console.error('Erreur validation username:', error);
        this.showError('Erreur serveur', 'Impossible de valider le nom d\'utilisateur.');
      }
    });
  }

  prevPage(): void {
    this.router.navigateByUrl("caddy");
  }

  newOrder(): void {
    localStorage.removeItem('caddy');
    this.order = new Order();
    this.router.navigateByUrl("e-com");
  }

  listOrder(): void {
    localStorage.removeItem('liste-order');
    this.order = new Order();
    this.router.navigateByUrl("caddy");
  }

  checkBtn(): boolean {
    return this.order.id !== 0;
  }

  confirOrder(orderForm: any): void {
    if (!this.usernameValide) {
      this.showWarning('Validation requise', 'Veuillez d\'abord valider votre nom d\'utilisateur.');
      return;
    }

    if (this.order.id) {
      this.controle_btn = true;
      return;
    }

    /**if (!this.validateForm(orderForm)) {
      return;
    }**/

    this.isSubmitting = true;
    this.updateOrderFromForm(orderForm);

    this.ordersService.addOrders(this.order).subscribe({
      next: (data: Order) => {
        this.order.id = data.id;
        this.isSubmitting = false;
        this.showSuccess('Commande confirmée', 'Votre commande a été enregistrée avec succès.');
        this.blockDocument();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Erreur inconnue';
        console.error('Erreur ajout commande:', error);
        this.showError('Erreur ajout commande', this.errorMessage);
      }
    });
  }

  private validateForm(orderForm: any): boolean {
    if (!orderForm.client || !orderForm.email || !orderForm.tel) {
      this.showWarning('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderForm.email)) {
      this.showWarning('Email invalide', 'Veuillez saisir un email valide.');
      return false;
    }

    return true;
  }

  private updateOrderFromForm(orderForm: any): void {
    this.order.client.name = orderForm.client;
    this.order.client.email = orderForm.email;
    this.order.client.phoneNumber = orderForm.tel;
    this.order.client.usernane = this.username;
  }

  blockDocument(): void {
    this.blockedDocument = true;
    setTimeout(() => {
      this.blockedDocument = false;
    }, 3000);
    this.caddyService.clearCaddy();
  }

  returnPageOrder(): void {
    this.router.navigateByUrl("caddy");
  }

  private showSuccess(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail
    });
  }

  private showError(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail
    });
  }

  private showWarning(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail
    });
  }
}