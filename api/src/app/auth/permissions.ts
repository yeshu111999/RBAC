import { Role } from './role.enum';

export type Permission =
  | 'VIEW_TASKS'
  | 'MANAGE_TASKS'
  | 'MANAGE_USERS'
  | 'VIEW_AUDIT_LOG';

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: ['VIEW_TASKS', 'MANAGE_TASKS', 'MANAGE_USERS', 'VIEW_AUDIT_LOG'],
  [Role.ADMIN]: ['VIEW_TASKS', 'MANAGE_TASKS', 'VIEW_AUDIT_LOG'],
  [Role.VIEWER]: ['VIEW_TASKS'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}
