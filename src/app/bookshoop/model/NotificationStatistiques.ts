export interface NotificationStatistiques {
  totalNotifications: number;
  notificationsEnvoyees: number;
  notificationsEnAttente: number;
  notificationsEchouees: number;
  tauxReussite: number;
  notificationsParType: { [key: string]: number };
  notificationsParCategorie: { [key: string]: number };
}
