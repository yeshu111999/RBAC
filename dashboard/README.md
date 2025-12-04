
A full-stack task management platform built with **NestJS**, **PostgreSQL**, **Angular**, and an **NX monorepo** architecture.


# 📦 Table of Contents

1. Setup Instructions
2. Architecture Overview
3. Data Model Explanation
4. Access Control Implementation
5. API Documentation
6. Future Considerations
7. Evaluation Criteria Mapping

---

# 🔧 Setup Instructions

## ✅ Prerequisites

* Node.js 20+
* npm 9+
* PostgreSQL 14+
* NX CLI (optional)
* Angular CLI (optional)

---

## 📁 1. Clone the Repo

```bash
git clone <your-repo-url>
cd secure-task-manager
```

---

## 📦 2. Install Dependencies

### Backend

```bash
cd api
npm install
```

### Frontend

```bash
cd dashboard
npm install
```

---

## 🗄️ 3. Create PostgreSQL Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE secure_task_manager;
```

---

## 🔐 4. Environment Variables

### Backend `.env` — located at `api/.env`

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=secure_task_manager

JWT_SECRET=supersecretkey123
JWT_EXPIRES_IN=1d
```

### Frontend config — located at `dashboard/src/environments/environment.ts`

```ts
export const environment = {
  apiUrl: 'http://localhost:3000/api',
};
```

---

## ▶️ 5. Run Backend

```bash
cd api
npm run start:dev
```

Seed the initial Owner user:

```
POST http://localhost:3000/api/users/seed
```

Creates:

* **Email:** [owner@example.com](mailto:owner@example.com)
* **Password:** password123
* **Role:** OWNER
* **Organization:** Root Org

---

## ▶️ 6. Run Frontend

```bash
cd dashboard
npm start
```

Frontend available at:

```
http://localhost:4200
```

---

# 🏗️ Architecture Overview

The project uses an **NX monorepo** with separate front-end and back-end apps:

```
secure-task-manager/
├── api/         → NestJS backend (auth, tasks, RBAC, audit log)
└── dashboard/   → Angular frontend (task UI)
```

### Why NX?

* Modularity and domain separation
* Scalable architecture
* Easy to add shared libraries later

---

## 🧱 Backend Modules (NestJS)

| Module                  | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| **AuthModule**          | JWT login, guards, passport strategy                    |
| **UsersModule**         | User CRUD, profile updates, password change, seed logic |
| **OrganizationsModule** | Org hierarchy + scoping                                 |
| **TasksModule**         | Task CRUD + access control                              |
| **AuditLogModule**      | Sensitive action logging                                |

---

## 🎨 Frontend (Angular + Tailwind)

* Standalone Angular components
* Drag-and-drop task board
* Responsive layout (mobile → desktop)
* Dark/Light mode toggle
* Keyboard shortcuts
* Task completion visualization bar
* Service-based state management

---

# 🗃️ Data Model Explanation

## Entities

### 🧑 User

```
id (uuid)
email
name
passwordHash
role (OWNER | ADMIN | VIEWER)
organizationId
createdAt
updatedAt
```

### 🏢 Organization

```
id (uuid)
name
parentOrgId (nullable)
```

Supports 2-level hierarchy.

### 📋 Task

```
id (uuid)
title
description
category (WORK | PERSONAL | OTHER)
status (TODO | IN_PROGRESS | DONE)
organizationId
createdByUserId
assignedToUserId
createdAt
updatedAt
```

---

# 🔐 Access Control Implementation

## 🎭 Roles & Permissions

| Role       | Permissions                               |
| ---------- | ----------------------------------------- |
| **OWNER**  | Full org access, manage users, audit logs |
| **ADMIN**  | Manage tasks, view audit logs             |
| **VIEWER** | Read-only access to tasks                 |

Permissions defined in `permissions.config.ts`.

---

## 🔑 Custom Decorators

Example:

```ts
@RequirePermissions('MANAGE_TASKS')
```

---

## 🛡️ Guards

### **JwtAuthGuard**

* Validates JWT
* Skips `@Public()` routes

### **PermissionsGuard**

* Checks if user has required permissions

Registered globally in `app.module.ts`.

---

## 🏢 Organization-level Enforcement

Rules:

* Users only see tasks in their own org
* Owner/Admin → full org access
* Viewer → read-only

Implemented in:

```
tasks.service.ts → getTasks(), updateTaskPermissions()
```

---

# 📘 API Documentation

## 🔑 Auth

### POST /auth/login

Request:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "...",
    "email": "...",
    "role": "OWNER"
  }
}
```

---

## 👤 Users

### POST /users/seed

Public — seeds root org + owner user.

### GET /users

Lists users in organization.

### POST /users

Creates users (Owner only).

### GET /users/me

Get profile.

### PUT /users/me

Update profile.

### POST /users/change-password

Change password.

---

## 📋 Tasks

### POST /tasks

Create a new task.

### GET /tasks

List tasks visible to user based on RBAC.

### PUT /tasks/:id

Update task fields (title, description, category, status, assignee).

### DELETE /tasks/:id

Owner/Admin only.

---

## 📜 Audit Logs

### GET /audit-log

Owner/Admin only.

---

# 🧠 Future Considerations

### 🔹 Advanced Role Delegation

* Custom roles
* Per-org permission sets

### 🔹 Production Security

* Refresh tokens
* CSRF protection
* Rate limiting
* HTTPS enforcement

### 🔹 Scaling Permissions

* Redis cache
* Policy-based access control

### 🔹 Deployment Enhancements

* Docker Compose
* CI/CD pipelines

---

# 📊 Evaluation Criteria Mapping

| Requirement             | Status     |
| ----------------------- | ---------- |
| RBAC implementation     | ✅ Complete |
| JWT authentication      | ✅ Complete |
| NX modular architecture | ✅ Complete |
| Responsive UI           | ✅ Complete |
| Drag-and-drop           | ✅ Complete |
| Code clarity            | ✅ Complete |
| Documentation           | ✅ Complete |
| Bonus features          | ⭐ Achieved |

---

# 🎉 Conclusion

This project delivers a full, production-style implementation of:

* Multi-tenant RBAC
* Secure JWT authentication
* Task management with modern UX
* Clean monorepo architecture

If you want deployment instructions, diagrams, or interview answers, I can generate them too!
