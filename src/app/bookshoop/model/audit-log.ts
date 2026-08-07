export interface AuditLog {
  id: number;
  actorUsername: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  timestamp: Date;
}
