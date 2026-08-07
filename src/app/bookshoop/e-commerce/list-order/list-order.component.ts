import { Component, OnInit } from '@angular/core';
import { ListOrderService } from '../../service/list-order.service';
import { LoginService } from '../../service/login.service';
import { Order } from '../../model/Order';
import { ItemProduct } from '../../model/Item-Product';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { UsernameCacheService } from '../../service/username-cache.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-list-order',
   standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, TableModule,CardModule,DialogModule ],
  templateUrl: './list-order.component.html',
  styleUrls: ['./list-order.component.css']
})
export class ListOrderComponent implements OnInit {

  constructor(private route: Router,private listOdersService: ListOrderService, private loginService: LoginService,private usernameCacheService:UsernameCacheService) { }
  orders!: Array<Order>;
  itemproduct!: Array<ItemProduct>;
  errorMessage!: string;
  etatOrder: boolean = false;
  numero_commande:string='Numerom de commande  ';
  first = 0;
  row = 10;
  first_product = 0;
  row_product = 10;
  visible: boolean = false;
  ngOnInit(): void {
     this.chargeAllOtrderByUser();

  }

  public chargeAllOtrderByUser(){
    let username =  this.usernameCacheService.getCachedUsername();
    if (username) {
      this.listOdersService.getOrders(username).subscribe({
        next: (data:Array<Order>) => {
          this.orders = data;
          console.log(this.orders);
        },
        error: err => {
          //console.log(err);
          this.errorMessage = err.message;
        }
      });
    }
  }

  next() {
    this.first = this.first + this.row;
  }
  preview() {
    this.first = this.first - this.row;
  }
  reset() {
    this.first = 0;
    this.chargeAllOtrderByUser();
  }
  pageChange(event: any) {
    this.first = event.first;
    this.row = event.row;
  }
  isLastPage(): boolean {
    
    return  this.orders ? this.first === this.orders.length - this.row : true;;
  }
  isFirstPage(): boolean {
    
    return this.orders ? this.first === 0 : true;;
  }

  next_product() {
    this.first = this.first + this.row;
  }
  preview_product() {
    this.first = this.first - this.row;
  }
  reset_product() {
    this.first_product = 0;

  }
  pageChange_product(event: any) {
    this.first_product = event.first;
    this.row_product = event.row;
  }
  isLastPage_product(): boolean {
    
    return  this.itemproduct ? this.first_product === this.itemproduct.length - this.row_product : true;
  }
  isFirstPage_product(): boolean {
    
    return this.itemproduct ? this.first_product === 0 : true;;
  }

  showDialogDetailOrders(ord:Order) {
    this.itemproduct=ord.products;
    this.numero_commande+=''+ord.id;
      this.visible = true;
  }
 commande(){
   this.route.navigateByUrl("e-com");
 }
}
