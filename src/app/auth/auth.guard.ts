import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const publicPaths = ['/caddy', '/e-com', '/order', '/liste-order'];

  if (publicPaths.includes(state.url)) {
    return true;
  }

  if (this.authService.isLoggedIn()) {
    if (this.authService.currentUserValue?.mustChangePassword) {
      this.router.navigateByUrl('change-password');
      return false;
    }
    return true;
  }

  this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
  }
}
