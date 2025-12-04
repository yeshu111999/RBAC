# 🔐 Access Control Implementation

This document explains the complete RBAC (Role-Based Access Control) logic used in the Secure Task Manager system.  
It covers roles, permissions, org hierarchy, guards, and how JWT integrates into request authorization.

---

# 1. Overview

Access control is enforced using three layers:

1. **JWT Authentication Layer**  
   - Ensures the user is logged in.
   - Extracts role + org from the token.

2. **Permission Layer (Role-Based Access Control)**  
   - Determines *what* actions a role may perform.

3. **Organization Scope Layer**  
   - Determines *which data* a user can access.

Together, these form a secure model for multi-tenant task management.

---

# 2. Roles & Permissions

The system supports **three roles**:

| Role | Intended Use |
|------|--------------|
| **OWNER** | Highest-level manager for the organization |
| **ADMIN** | Manages tasks in the organization |
| **VIEWER** | Read-only access to tasks |

---

## 2.1 Permission Map

Permissions are statically defined inside:

`api/src/app/auth/permissions.config.ts`

```ts
OWNER:  ['VIEW_TASKS', 'MANAGE_TASKS', 'MANAGE_USERS', 'VIEW_AUDIT_LOG']
ADMIN:  ['VIEW_TASKS', 'MANAGE_TASKS', 'VIEW_AUDIT_LOG']
VIEWER: ['VIEW_TASKS']

---

# 3. JwtAuthGuard

request.user = {
  userId: 'abc123',
  role: 'ADMIN',
  organizationId: 'org1',
  email: 'admin@example.com'
};



