import { Component } from '@angular/core';
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
import { User } from '../../model/user';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ToastModule,MessagesModule,CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  userSession: any ;
  user:any;
  //user_jwtoken!: JwtResponse;

  erroMessage!: string;

  constructor(public loginService: LoginService, private router: Router, private messageService: MessageService,private authentificationService:AuthService) { }

  ngOnInit(): void {
  }

  onLogin(dataForm: any) {

    this.authentificationService.login(dataForm.username, dataForm.password).subscribe({
      next: (data: UserSession) => {
        this.userSession = data;
        this.user=this.userSession.userDTO;
        //this.user.roles.permissions=this.userSession.permissions;
        //this.chargeValueUser(data);
        console.log(this.user);
        if (this.user != undefined && this.user?.echeck_connection === false) {
         // this.loginService.createTokenUser(this.user);n
         console.log(this.authentificationService.isLoggedIn());
         if (this.authentificationService.isLoggedIn()===true) {
            //this.loginService.saveAuthenticateduser();
            this.router.navigateByUrl('dashboard');

          } 

        }else {
          this.messageService.add({ severity: 'error', summary: 'Authentification ERROR ', detail: this.user?.messageEcheck });
           this.router.navigateByUrl('login');

        }
      },
      error: err => {
        //console.log(err);
        this.erroMessage = err.message;
        this.messageService.add({ severity: 'error', summary: 'ERROR LOGIN', detail: this.erroMessage });
      }
    });


  }
  
}
