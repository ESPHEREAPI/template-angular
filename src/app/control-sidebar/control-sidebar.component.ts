import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-control-sidebar',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './control-sidebar.component.html',
  styleUrl: './control-sidebar.component.css'
})
export class ControlSidebarComponent {
  darkMode: boolean = false;
  sidebarSkin: string = 'dark';
  navbarVariant: string = 'primary';
  accentColor: string = 'primary';
  
  changeTheme(): void {
    const body = document.querySelector('body');
    if (this.darkMode) {
      body?.classList.add('dark-mode');
    } else {
      body?.classList.remove('dark-mode');
    }
  }
  
  changeSidebarSkin(): void {
    const sidebar = document.querySelector('.main-sidebar');
    sidebar?.classList.remove('sidebar-dark-primary', 'sidebar-light-primary');
    sidebar?.classList.add(`sidebar-${this.sidebarSkin}-primary`);
  }
  
  changeNavbarVariant(): void {
    const navbar = document.querySelector('.main-header');
    navbar?.classList.remove('navbar-dark', 'navbar-light', 'navbar-white', 'navbar-primary', 'navbar-secondary', 'navbar-info', 'navbar-success', 'navbar-danger', 'navbar-warning');
    navbar?.classList.add(`navbar-${this.navbarVariant}`);
  }
  
  changeAccentColor(): void {
    const body = document.querySelector('body');
    body?.classList.remove('accent-primary', 'accent-success', 'accent-warning', 'accent-danger', 'accent-info');
    body?.classList.add(`accent-${this.accentColor}`);
  }
}
