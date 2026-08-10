import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';

import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { User } from '../model/user';

import { Profil } from '../model/profil';
import { Module } from '../model/module';
import { Menu } from '../model/menu';
import { IndicatifPays } from '../model/indicatif-pays';
import { Role } from '../model/role';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ModulesUsers } from '../model/modules-users';
import { MenusUsers } from '../model/menus-users';

@Injectable({
  providedIn: 'root'
})
export class UserService {

 private readonly API_URL =`${environment.apiUrl}/gateway-proxy/api/users`;
  // private apiUrl = ;
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  private modulesUsers: ModulesUsers = {} as ModulesUsers; // Initialisation
  private menusUsers:MenusUsers ={} as MenusUsers;

  constructor(private http: HttpClient,private auth:AuthService) {
    
  }

  // Utilisateurs
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/all`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

 //createUser(user: User): Observable<User> {
 // return this.http.post<User>(`${this.API_URL}/register`, user);
// }
 createUser(user: User): Observable<User> {
console.log(user)
  return this.http.post<User>(`${this.API_URL}/register`, user).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erreur côté backend:', error);
      return throwError(() => error); // relancer l'erreur pour gestion dans le composant
    })
);
}

  updateUser(user: User): Observable<User> {
    const userid=user.id;
    return this.http.put<User>(`${this.API_URL}/${userid}/update-user`, user);
  }
   updateUserDataAndPassWord(user: User): Observable<User> {
    const userid=user.id;
    return this.http.put<User>(`${this.API_URL}/${userid}/update-user-password`, user);
  }

  deleteUser(userName: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${userName}`);
  }

  // Rôles
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/roles`);
  }

  // Profils
  getProfils(): Observable<Profil[]> {
    return this.http.get<Profil[]>(`${this.API_URL}/profils`);
  }

  // Modules
  getModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.API_URL}/modules`);
  }

  getUserModules(id: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.API_URL}/${id}/modules`);
  }

   getUsernameModules(username: string): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.API_URL}/${username}/modules-username`);
  }
   getModulesNotUser(userid: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.API_URL}/${userid}/not-modules`);
  }

  updateUserModules(id: number,userinsert:string , modules: Module[]): Observable<void> {
   console.log(id);
     this.modulesUsers = {
      userid: id,
      creatBy: userinsert,
      modules: modules
    };
   //this.modulesUsers.userid=id;
   //this.modulesUsers.creatBy=userinsert,
   //this.modulesUsers.modules=modules;
   let moduleUserDTO =this.modulesUsers;

   console.log(this.modulesUsers);
   console.log(moduleUserDTO);
    return this.http.put<void>(`${this.API_URL}/modules-users`, this.modulesUsers);
  }

  // Menus
  getMenusByModule(moduleId: number): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.API_URL}/modules/${moduleId}/menus`);
  }

  getUserMenus(id: number, moduleId: number): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.API_URL}/${id}/modules/${moduleId}/menus`);
  }

  updateUserMenus(id: number,userinsert:string, moduleId: number, menus: Menu[]): Observable<void> {
    this.menusUsers = {
      userid: id,
      creatBy: userinsert,
      moduleid: moduleId,
      menus:menus
    };
    console.log(this.menusUsers)
    return this.http.put<void>(`${this.API_URL}/menus-users`, this.menusUsers);
  }

  // Indicatifs pays
  getIndicatifsPays(): Observable<IndicatifPays[]> {
    return this.http.get<IndicatifPays[]>(`${this.API_URL}/indicatifs-pays`);
  }

  // Recherche
  searchUsers(filter: any): Observable<User[]> {
    let params = new HttpParams();
    Object.keys(filter).forEach(key => {
      if (filter[key] !== null && filter[key] !== undefined && filter[key] !== '') {
        params = params.set(key, filter[key]);
      }
    });
    return this.http.get<User[]>(`${this.API_URL}/search`, { params });
  }

  getUserConnected(): any {
    let token = localStorage.getItem('authToken_esacompro');
    if (token) {
      let user = JSON.parse(atob(token));
      //console.log(user);
      //return { username: user.username, roles: user.roles };
      //return this.userAuthenticated;
      return user;
    }
    return null;
  }

  // Menus
  getMenusUser(username: string): Observable<MenusUsers> {
    return this.http.get<MenusUsers>(`${this.API_URL}/${username}/all-menus-users`);
  }
  checkUsername(username: string): Observable<boolean> {
    
  return this.http.get<boolean>(`${this.API_URL}/check/${username}`);
}

}
