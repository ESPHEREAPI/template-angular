export interface AuditAccessGrant {
  id: number;
  granteeUsername: string;
  grantedByUsername: string;
  grantedAt: Date;
  revoked: boolean;
}
