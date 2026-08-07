import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from '../model/Order';


@Injectable({
  providedIn: 'root'
})
export class ListOrderService {
public host: string = `${environment.apiUrl}/gateway-proxy/api/microservice-produits//e-com`;
  constructor(private http:HttpClient) { }

  public getOrders(username:string):Observable<Array<Order>>{
    return this.http.get<Array<Order>>(this.host+"/articles/order/"+username);
  }
}
