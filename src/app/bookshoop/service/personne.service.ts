import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Person } from '../model/person';
import { ApiResponse } from '../model/api-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PersonneService {

 private apiUrl = '/api/personnes';

  constructor(private http: HttpClient) {}

  getAllPersonnes(): Observable<ApiResponse<Person[]>> {
    return this.http.get<ApiResponse<Person[]>>(this.apiUrl);
  }

  creerPersonne(personne: Person): Observable<ApiResponse<Person>> {
    return this.http.post<ApiResponse<Person>>(this.apiUrl, personne);
  }
}
