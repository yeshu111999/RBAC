# 📊 Data Model Explanation

This document describes the core data models used in the Secure Task Manager system, including their relationships, fields, and how they support RBAC and organization-level scoping.

---

# 🧱 1. Overview

The system contains the following main entities:

- **User**
- **Organization**
- **Task**

Each entity is modeled using **TypeORM** in the NestJS backend.  
The data model is intentionally simple, scalable, and optimized for multi-tenant RBAC systems.

---

# 👤 2. User Model

Represents system users with role assignments and org membership.

### **Entity Fields**
```ts
User {
  id: string;               // UUID primary key
  email: string;            // unique
  name: string;             // display name
  passwordHash: string;     // bcrypt hash
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  organizationId: string;   // FK → Organization
  createdAt: Date;
  updatedAt: Date;
}

Organization {
  id: string;               // UUID primary key
  name: string;
  parentId?: string | null; // self-referencing
  createdAt: Date;
}

Task {
  id: string;                      // UUID
  title: string;
  description?: string;
  category: 'WORK' | 'PERSONAL' | 'OTHER';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';

  organizationId: string;          // FK → Organization
  createdByUserId: string;         // FK → User

  assignedToUserId?: string | null; // FK → User (assignee)

  createdAt: Date;
  updatedAt: Date;
}

Organization (1) ──── (many) Users
Organization (1) ──── (many) Tasks

User (1) ──── (many) Tasks Created
User (1) ──── (many) Tasks Assigned


┌─────────────────┐       1        n ┌─────────────────┐
│  Organization   │────────────────▶│       User      │
│─────────────────│                 │─────────────────│
│ id (PK)         │                 │ id (PK)         │
│ name            │                 │ email           │
│ parentOrgId (FK)│                 │ role            │
└─────────────────┘                 │ organizationId  │
                                    └─────────────────┘
                                              │ 1
                                              │
                                              ▼ n
                                    ┌─────────────────┐
                                    │      Task       │
                                    │─────────────────│
                                    │ id (PK)         │
                                    │ title           │
                                    │ status          │
                                    │ category        │
                                    │ organizationId  │
                                    │ createdByUserId │
                                    │ assignedToUserId│
                                    └─────────────────┘
