import { Injectable } from '@angular/core';
import { Users } from '../model/Users';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public host: string = `${environment.apiUrl}`;

  private users = [
    { username: 'admin', password: '123', roles: ['ADMIN', 'USER'] },
    { username: 'user1', password: '123', roles: ['USER'] },
    { username: 'user2', password: '123', roles: ['USER'] }];
  public isAuthenticated: boolean = false;
  public userAuthenticated!: any;
  public token!: any;
  user!: Users ;


  constructor(private router: Router, private http: HttpClient) { }

  public login(username: string, password: string): Observable<Users> {
    this.user = new Users();
    this.user.email = username;
    this.user.password = password;
   return this.http.post<Users>(this.host + "/gateway-proxy/api/auth/login", this.user);

    
  }
  public createTokenUser(u: Users) {
    this.token = { username: u.nom, roles: u.roles };
    this.isAuthenticated = true;
    this.userAuthenticated =   this.token;

  }

  public isAdmin() {
    if (this.isAuthenticated) {
      if (this.userAuthenticated.roles.indexOf('ADMIN') > -1) {
        return true;
      }

    }
    return false;
  }
  public saveAuthenticateduser() {
    if (this.isAuthenticated) {
      localStorage.setItem('authToken', btoa(JSON.stringify(this.token)));

    }
  }
  public loadAuthentificathedUserFromlocalStorage() {

    let token = localStorage.getItem('authToken');
    if (token) {
      let user =  JSON.parse(atob(token));
      //this.userAuthenticated = { username: user.username, roles: user.roles };
      this.userAuthenticated=user;

      this.isAuthenticated = true;
      //this.router.navigateByUrl('admin/dashboard');
    } else {
      if (this.isAuthenticated == false && this.userAuthenticated == undefined) {
        this.router.navigateByUrl('');
      }
    }
  }


  public removeTokenfromLocalStorage() {

    localStorage.removeItem('authToken');
    this.isAuthenticated = false;
    this.token = undefined;
    this.userAuthenticated = undefined;
  }
  public isConnect() {
    return this.isAuthenticated;
  }
}
