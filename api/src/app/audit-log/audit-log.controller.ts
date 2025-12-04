import { Controller, Get, Req } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuthUser } from '../auth/auth-user.interface';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-log
   * View audit logs for the authenticated user's organization.
   * Accessible only to Owner and Admin via permissions guard.
   */
  @Get()
  @RequirePermissions('VIEW_AUDIT_LOG')
  getAuditLog(@Req() req: { user: AuthUser }) {
    return this.auditLogService.getEntries(req.user);
  }
}
