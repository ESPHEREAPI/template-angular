import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
  })
export class RoleGuard implements CanActivate {

    constructor(
        private router: Router,
        private authService: AuthService
      ) { }

      canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        // Vérifier si l'utilisateur est connecté
        if (!this.authService.isLoggedIn()) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
    
        // Vérifier les permissions requises
        const requiredPermissions = route.data['permissions'] as string[];
        if (!requiredPermissions || requiredPermissions.length === 0) {
          return true;
        }
    
        // Vérifier si l'utilisateur a les permissions nécessaires
        const permissionCheckMethod = route.data['permissionCheckMethod'] || 'any';
        
        if (permissionCheckMethod === 'all') {
          if (!this.authService.hasAllPermissions(requiredPermissions)) {
            this.router.navigate(['/unauthorized']);
            return false;
          }
        } else {
          if (!this.authService.hasAnyPermission(requiredPermissions)) {
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }
    
        return true;
      }
}
