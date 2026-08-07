import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from '../model/Order';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  public host: string = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com`;
  constructor(private http: HttpClient) { }

  public addOrders(order:Order):Observable<Order>{
    console.log(order);
    return this.http.post<Order>(this.host+"/articles/order",order);
  }

 
}
