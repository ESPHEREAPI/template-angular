import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private counterNotification = 0;


constructor() {}

  success(message: string, title: string = 'Succès'): void {
    // Utilisation de toastr ou autre library de notification
    console.log(`${title}: ${message}`);
  }

  error(message: string, title: string = 'Erreur'): void {
    console.error(`${title}: ${message}`);
  }

  warning(message: string, title: string = 'Attention'): void {
    console.warn(`${title}: ${message}`);
  }

  info(message: string, title: string = 'Information'): void {
    console.info(`${title}: ${message}`);
  }
  
}
