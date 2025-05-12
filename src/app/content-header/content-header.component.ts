import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-content-header',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './content-header.component.html',
  styleUrl: './content-header.component.css'
})
export class ContentHeaderComponent {
@Input() pageTitle: string='';
@Input() breadcrumbItems: Array<{label:string,route?:string,active?:boolean}> = [

];
}
