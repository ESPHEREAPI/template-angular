
import { ClientOrder } from "./client-order";
import { ItemProduct } from "./Item-Product";


export class Order{
     id !:number;
     client !:ClientOrder
     products!:Array<ItemProduct>;
     totalAmount!: number;
     date!:Date;
      payement!:Date;

}