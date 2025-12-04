import { Role } from './role.enum';

// Map each role to the permissions it has.
export const RolePermissions: Record<Role, string[]> = {
  OWNER: [
    'VIEW_TASKS',
    'MANAGE_TASKS',
    'MANAGE_USERS',
    'VIEW_AUDIT_LOG',
  ],
  ADMIN: [
    'VIEW_TASKS',
    'MANAGE_TASKS',
    'VIEW_AUDIT_LOG',
  ],
  VIEWER: [
    'VIEW_TASKS',
  ],
};
