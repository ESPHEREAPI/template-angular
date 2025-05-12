import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { ContentHeaderComponent } from '../content-header/content-header.component';
import { ControlSidebarComponent } from '../control-sidebar/control-sidebar.component';
import { AuthService } from '../auth/auth.service';
import { User } from '../model/user';

@Component({
  selector: 'app-admin-layout.component',
  standalone: true,
  imports: [RouterModule,HeaderComponent,SidebarComponent,FooterComponent,ContentHeaderComponent,ControlSidebarComponent],
  templateUrl: './admin-layout.component.component.html',
  styleUrl: './admin-layout.component.component.css'
})
export class AdminLayoutComponentComponent implements OnInit {
  user: User | null = null;
  userSession: any ;
  constructor(private renderer: Renderer2,private authService: AuthService){}
  ngOnInit(): void {
    this.renderer.addClass(document.body,'sidebar-mini');
    this.renderer.addClass(document.body,'layout-fixed');
    this.userSession = this.authService.currentUserValue;
  if ( this.userSession &&  this.userSession.userDTO) {
    console.log(this.user)
    this.user =  this.userSession.userDTO;
  }
  }

}
