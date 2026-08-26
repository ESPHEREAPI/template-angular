import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Forme generique du statut affiche par ce badge - independante du domaine
 * (vente, code-barres...). Chaque service metier hors-ligne (voir
 * ConnectivityService + IndexedDbQueueService) expose son statut sous cette
 * forme pour pouvoir reutiliser ce composant sans dupliquer son balisage.
 */
export interface SyncStatusView {
  isOnline: boolean;
  backendAvailable: boolean;
  pendingCount: number;
  failedCount: number;
  syncInProgress: boolean;
  lastSync?: Date;
  /** Ex. "vente(s)", "association(s)" - personnalise le libellé affiché. */
  itemLabel?: string;
}

@Component({
  selector: 'app-sync-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-status-badge.component.html',
  styleUrls: ['./sync-status-badge.component.css']
})
export class SyncStatusBadgeComponent {
  @Input() status!: SyncStatusView;
  @Output() syncNow = new EventEmitter<void>();
  @Output() retryFailed = new EventEmitter<void>();

  showDetails = false;

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  get itemLabel(): string {
    return this.status.itemLabel || 'élément(s)';
  }
}
