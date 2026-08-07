import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../model/product';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  public host: string = `${environment.apiUrl}/gateway-proxy/api/microservice-produits/e-com`;

  constructor(private http: HttpClient) { }
  public getResource(url: string): Observable<Array<Product>> {
    return this.http.get<Array<Product>>(this.host + url);
  }
  uploadPhotoProduct(file: File, idProduct: number): Observable<HttpEvent<{}>> {
    let formData: FormData = new FormData();
    formData.append('file', file);
    const header = new Headers({ 'Content-Type': 'multipart/form-data' });
    //neededHeaders.append('Access-Control-Allow-Credentials', 'true');

    // formData.append('Access-Control-Allow-Credentials', 'true');
    //{ headers: headers, "Content-Type": "multipart/form-data", "file": formData }
    
    const req = new HttpRequest('POST', this.host + '/articles/' + idProduct + '/uploadPhoto', formData, {
      reportProgress: true, responseType: 'text'
  
    });
    //return this.http.post(this.host + '/'+idProduct+'/uploadPhoto', { headers: headers, "Content-Type": "multipart/form-data", "file": formData });
    return this.http.request(req);

  }

  public searchProducts( keyword:string,idCat:number):Observable<Array<Product>>{
    return this.http.get<Array<Product>>(this.host+`/articles/categories/search/`+idCat+`?kw=`+keyword);
  }

  public getProduitByIdCategorie(url: string): Observable<Array<Product>> {
    return this.http.get<Array<Product>>(this.host + url);
  }
}
