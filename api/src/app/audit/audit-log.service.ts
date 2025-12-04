import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user.interface';

export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  email: string;
  organizationId: string | null;
  action: string;
  meta?: any;
}

@Injectable()
export class AuditLogService {
  // In-memory log; fine for coding challenge
  private entries: AuditLogEntry[] = [];

  /**
   * Log an action performed by a user.
   */
  log(user: AuthUser, action: string, meta?: any) {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId: user.userId,
      email: user.email,
      organizationId: user.organizationId ?? null,
      action,
      meta,
    };

    this.entries.push(entry);

    // Basic logging to console (meets requirement)
    console.log('[AUDIT]', entry);
  }

  /**
   * Return audit logs visible to the requesting user.
   * OWNER/ADMIN only (PermissionsGuard enforces that),
   * and only for their organization.
   */
  getEntries(requestingUser: AuthUser): AuditLogEntry[] {
    if (!requestingUser.organizationId) {
      return [];
    }

    return this.entries.filter(
      (entry) => entry.organizationId === requestingUser.organizationId,
    );
  }
}
