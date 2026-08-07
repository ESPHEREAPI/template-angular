import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HealthResponse } from "../bookshoop/model/HealthResponse";
import { environment } from "../../environments/environment";

// Service
@Injectable({
  providedIn: 'root'
})
export class HealthService {
  //private apiUrl = '/api/health';
  private readonly apiUrl =`${environment.apiUrl}/gateway-proxy/api/microservice-produits/health`;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(this.apiUrl);
  }
}