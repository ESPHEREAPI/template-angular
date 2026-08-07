import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuditLog } from '../../model/audit-log';
import { AuditAccessGrant } from '../../model/audit-access-grant';
import { AuditService } from '../../service/audit.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css']
})
export class AuditComponent implements OnInit {
  logs: AuditLog[] = [];
  grants: AuditAccessGrant[] = [];
  loading = false;
  newGranteeUsername = '';

  constructor(
    private auditService: AuditService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  get isSuperAdmin(): boolean {
    return this.authService.currentUserValue?.usersDTO?.role?.name === 'SUPER_ADMIN';
  }

  ngOnInit(): void {
    this.loadLogs();
    if (this.isSuperAdmin) {
      this.loadGrants();
    }
  }

  loadLogs(): void {
    this.loading = true;
    this.auditService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error("Impossible de charger le journal d'audit.");
        console.error(error);
      }
    });
  }

  loadGrants(): void {
    this.auditService.getAccessGrants().subscribe({
      next: (data) => (this.grants = data),
      error: (error) => console.error(error)
    });
  }

  grantAccess(): void {
    if (!this.newGranteeUsername) {
      this.toastr.warning("L'identifiant de la personne est obligatoire.");
      return;
    }
    this.auditService.grantAccess({ granteeUsername: this.newGranteeUsername }).subscribe({
      next: () => {
        this.newGranteeUsername = '';
        this.loadGrants();
        this.toastr.success('Acces audit accorde.');
      },
      error: (error) => this.toastr.error(error?.error?.message || "Erreur lors de l'octroi de l'acces.")
    });
  }

  revokeAccess(grant: AuditAccessGrant): void {
    this.auditService.revokeAccess(grant.id).subscribe({
      next: () => {
        this.loadGrants();
        this.toastr.success('Acces audit revoque.');
      },
      error: (error) => this.toastr.error(error?.error?.message || "Erreur lors de la revocation de l'acces.")
    });
  }
}
