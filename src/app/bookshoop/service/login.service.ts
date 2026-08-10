import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private users = [{ username: 'admin', password: '123', roles: ['ADMIN', 'USER'] },
  { username: 'user1', password: '123', roles: ['USER'] },
  { username: 'user2', password: '123', roles: ['USER'] }]

  public isAuthenticated: boolean=false;
  public userAuthenticated!: any;
  public token!: any;

  constructor(private router: Router,private http: HttpClient) { }

  public login(username: string, password: string) {
    let user;
    this.users.forEach(u => {
      if (u.username == username && u.password == password) {
        user = u;
        this.token = { username: u.username, roles: u.roles };
      }
    });
    if (user) {
      this.isAuthenticated = true;
      this.userAuthenticated = user;
    } else {
      this.isAuthenticated = false;
      this.userAuthenticated = undefined
    }
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
      localStorage.setItem('authToken_esacompro', btoa(JSON.stringify(this.token)));
    }
  }
  public loadAuthentificathedUserFromlocalStorage() {
    let token = localStorage.getItem('authToken_esacompro');
    if (token) {
      let user = JSON.parse(atob(token));
      this.userAuthenticated = { username: user.username, roles: user.roles };

      this.isAuthenticated = true;
    } else {
      if (this.isAuthenticated == false && this.userAuthenticated == undefined) {
        this.router.navigateByUrl('/login');
      }
    }
  }
  public removeTokenfromLocalStorage() {
    localStorage.removeItem('authToken_esacompro');
    this.isAuthenticated = false;
    this.token = undefined;
    this.userAuthenticated = undefined;
  }
  public isConnect() {
  return this.isAuthenticated;
  }

  checkUsername(username: string): Observable<boolean> {
  return this.http.get<boolean>(`/api/users/check-username/${username}`);
}

}
