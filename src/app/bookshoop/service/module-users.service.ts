import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModuleUsersService {
 private readonly API_URL =`${environment.apiUrl}/gateway-proxy/api/users`;
  constructor(private http: HttpClient) { }

   checkModuleUserExiste(usernames: string,codemodule:string): Observable<boolean> {
  //console.log(usernames);
  //console.log(codemodule)
   const modulesUser = {
      username: usernames,
      modulecode: codemodule
     
    };
    return this.http.put<boolean>(`${this.API_URL}/module-exist`, modulesUser).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur côté backend:', error);
        return throwError(() => error); // relancer l'erreur pour gestion dans le composant
      })
  );
  }

  
   checkMenuUserExiste(usernames: string,codemodule:string,menucode:string): Observable<boolean> {
  console.log(usernames);
  console.log(codemodule)
   const menuUser = {
      username: usernames,
      modulecode: codemodule,
      menucode:menucode
     
    };
    return this.http.put<boolean>(`${this.API_URL}/menu-exist`, menuUser).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur côté backend:', error);
        return throwError(() => error); // relancer l'erreur pour gestion dans le composant
      })
  );
  }
}
