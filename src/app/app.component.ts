import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminLayoutComponentComponent } from "./admin-layout.component/admin-layout.component.component";
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private primeng: PrimeNG) { }
  ngOnInit(): void {
    this.primeng.ripple.set(true);
  }
  title = 'adminlte-angular-app';
}
