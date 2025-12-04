import { Controller, Get, Req } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuthUser } from '../auth/auth-user.interface';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-log
   * Visible to Owner/Admin only via permission guard.
   * Returns all logged events (task actions, auth events, etc.)
   */
  @Get()
  @RequirePermissions('VIEW_AUDIT_LOG')
  async getAuditLog(@Req() req: { user: AuthUser }) {
    return this.auditLogService.getEntries(req.user);
  }
}
