export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  titre: string;
  message?: string;
  duree?: number;
  timestamp: Date;
  icone?: string;
}