import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
//import { MenuItem } from '../model/menu-item';
import { AuthService } from '../auth/auth.service';
import { User } from '../model/user';
import { MenuItem } from 'primeng/api';
//import { MenuItem } from '../model/menu-item';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() user: User | null = null;
  imagePath = '../img/user2-160x160.jpg';

  //menuItems: MenuItem[] = [];


  constructor(private authService: AuthService) {
    


  }
  ngOnInit(): void {
    if (this.user) {
      this.imagePath = this.user.profileImageUrl ?? '../img/user2-160x160.jpg';
    } else {
      this.imagePath = '../img/user2-160x160.jpg';
    }

  }
  hasPermission(item: MenuItem): boolean {
   
   //if (!item.permissions || item.permissions.length === 0) {
   //   return true;
   // }

   // return item.permissions.some(permission => this.authService.hasPermission(permission)); 
   return true;

  }

  hasChildPermissions(item: MenuItem): boolean {
    //if (!item.children || item.children.length === 0) {
     // return false;
   // }

    //return item.children.some(child => this.hasPermission(child));
    return true;
  }

  toggleExpanded(item: MenuItem): void {
    item.expanded = !item.expanded;
  }


menuItems = [
    {
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      children: []
    },
    {
      title: 'Utilisateurs',
      icon: 'fas fa-users',
      route: '',
      children: [
        {
          title: 'Gestion des Utilisateurs',
          icon: 'far fa-circle',
          route: '/users'
        },
        {
          title: 'Roles',
          icon: 'far fa-circle',
          route: '/role'
        },
        {
          title: 'Permission',
          icon: 'far fa-circle',
          route: '/permission'
        }
        
      ]
    },
    {
      title: 'Paramètres',
      icon: 'fas fa-cogs',
      route: '',
      children: [
        {
          title: 'Général',
          icon: 'far fa-circle',
          route: '/general'
        },
        {
          title: 'Sécurité',
          icon: 'far fa-circle',
          route: '/security'
        }
      ]
    }
  ];



}
