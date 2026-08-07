import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Catalogue } from '../model/catalogues.models';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CatalogueService {
  public host: string = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com`;
  //"http://localhost:9001";
  constructor(private http: HttpClient) { }

  public getResource(url: string) : Observable<Array<Catalogue>>{
    return this.http.get<Array<Catalogue>>(this.host+url);
   
  
  }

  public getCategorieById(url:string):Observable<Catalogue>{

    return this.http.get<Catalogue>(this.host+url);
  }
}
