import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { AuthService } from "../auth/auth.service";

@Directive({
    selector: '[hasPermission]'
  })
export class HasPermissionDirective implements OnInit {
    
    @Input() hasPermission: string | string[] = [];
    @Input() hasPermissionCheckType: 'all' | 'any' = 'any';
    
    private isHidden = true;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private authService: AuthService
      ) { }
    
      ngOnInit(): void {
        this.updateView();
      }
      private updateView(): void {
        if (this.checkPermission()) {
          if (this.isHidden) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.isHidden = false;
          }
        } else {
          this.viewContainer.clear();
          this.isHidden = true;
        }
      }
    
      private checkPermission(): boolean {
        if (!this.hasPermission) {
          return true;
        }
    
        const permissions = Array.isArray(this.hasPermission)
          ? this.hasPermission
          : [this.hasPermission];
    
        if (this.hasPermissionCheckType === 'all') {
          return this.authService.hasAllPermissions(permissions);
        }
        return this.authService.hasAnyPermission(permissions);
      }

}

