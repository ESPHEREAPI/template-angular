import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponentComponent } from './admin-layout.component/admin-layout.component.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './module-users/login/login.component';
import { UsersComponent } from './module-users/users/users.component';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role-guard';
import { UserListComponent } from './user-manager/user-list/user-list.component';
import { UserFormComponent } from './user-manager/user-form/user-form.component';
import { UserDetailComponent } from './user-manager/user-detail/user-detail.component';
import { GeneralSettingsComponent } from './module-users/general-settings/general-settings.component';
import { SecuritySettingsComponent } from './module-users/security-settings/security-settings.component';
import { UserRoleComponent } from './user-manager/user-role/user-role.component';

export const routes: Routes = [

  

    {
      
        path: '',
        canActivate: [AuthGuard, RoleGuard],
        component: AdminLayoutComponentComponent,
        children: [
       
          { path: 'dashboard', component: DashboardComponent },
         
         // { path: 'users', component: UsersComponent },
          {
            path: 'users',
            component: UserListComponent,
            canActivate: [AuthGuard, RoleGuard],
            data: {
              permissions: ['READ'],
              permissionCheckMethod: 'any'
            }
          },
          {
            path: 'role',
            component: UserRoleComponent,
            canActivate: [AuthGuard, RoleGuard],
            data: {
              permissions: ['READ'],
              permissionCheckMethod: 'any'
            }
          },
          {
            path: 'create',
            component: UserFormComponent,
            canActivate: [AuthGuard, RoleGuard],
            data: {
              permissions: ['WRITE'],
              permissionCheckMethod: 'any'
            }
          },

          {
            path: 'edit/:id',
            component: UserFormComponent,
            canActivate: [AuthGuard, RoleGuard],
            data: {
              permissions: ['UPDATE'],
              permissionCheckMethod: 'any'
            }
        },
            {
                path: 'detail/:id',
                component: UserDetailComponent,
                canActivate: [AuthGuard, RoleGuard],
                data: {
                  permissions: ['READ'],
                  permissionCheckMethod: 'any'
                }
              },
              {
                path: 'general',
                component: GeneralSettingsComponent,
                canActivate: [AuthGuard, RoleGuard],
                data: {
                  permissions: ['READ'],
                  permissionCheckMethod: 'any'
                }
              },
              {
                path: 'security',
                component: SecuritySettingsComponent,
                canActivate: [AuthGuard, RoleGuard],
                data: {
                  permissions: ['READ'],
                  permissionCheckMethod: 'any'
                }
              }
          
          //{ path: 'settings/general', component: GeneralSettingsComponent },
         // { path: 'settings/security', component: SecuritySettingsComponent },
        ]
    },
    { path: 'login', component: LoginComponent },
 
     
];



@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }