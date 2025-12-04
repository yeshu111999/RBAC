
# 🌐 Base URL

```text
http://localhost:3000/api
```

All protected endpoints require:

```http
Authorization: Bearer <JWT>
```

---

## 🔐 AUTH

---

### 1️⃣ `POST /auth/login`

**Description:** Authenticate user and return JWT + basic profile.
**Auth:** Public (no token)

**Request**

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "f8788031-368b-4fcb-b1d1-4d20601b2625",
    "email": "owner@example.com",
    "role": "OWNER",
    "organizationId": "9300918f-6f29-48a6-8e55-53f135dd6f9f"
  }
}
```

**Errors**

* `401 Unauthorized` – invalid credentials

---

## 👥 USERS

---

### 2️⃣ `POST /users/seed`

**Description:** Seed default root organization and an OWNER user.
**Auth:** Public (only for initial setup, guarded by @Public)

**Request**

```json
{}
```

**Response (201)**

```json
{
  "message": "Seeded default organization and owner user",
  "owner": {
    "email": "owner@example.com",
    "password": "password123"
  }
}
```

---

### 3️⃣ `GET /users`

**Description:** List all users in the same organization.
**Auth:** JWT
**Role:** OWNER, ADMIN

**Request**

```http
GET /api/users
Authorization: Bearer <token>
```

**Response (200)**

```json
[
  {
    "id": "f8788031-368b-4fcb-b1d1-4d20601b2625",
    "email": "owner@example.com",
    "name": "Default Owner",
    "role": "OWNER",
    "organizationId": "9300918f-6f29-48a6-8e55-53f135dd6f9f",
    "createdAt": "2025-12-02T14:37:13.027Z",
    "updatedAt": "2025-12-02T14:37:13.027Z"
  }
]
```

**Errors**

* `403 Forbidden` – Viewer role calling this endpoint

---

### 4️⃣ `POST /users`

**Description:** Create a new user (Admin or Viewer) in the same organization.
**Auth:** JWT
**Role:** OWNER

**Request**

```json
{
  "email": "admin1@example.com",
  "name": "Admin User",
  "role": "ADMIN"
}
```

**Response (201)**

```json
{
  "user": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "email": "admin1@example.com",
    "name": "Admin User",
    "role": "ADMIN",
    "organizationId": "9300918f-6f29-48a6-8e55-53f135dd6f9f"
  },
  "password": "TempPass!947"
}
```

**Errors**

* `400 Bad Request` – email already in use
* `403 Forbidden` – non-owner tries to call this

---

### 5️⃣ `GET /users/me`

**Description:** Get current user profile.
**Auth:** JWT

**Request**

```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response (200)**

```json
{
  "id": "f8788031-368b-4fcb-b1d1-4d20601b2625",
  "email": "owner@example.com",
  "name": "Default Owner",
  "role": "OWNER",
  "organizationId": "9300918f-6f29-48a6-8e55-53f135dd6f9f"
}
```

---

### 6️⃣ `PUT /users/me`

**Description:** Update current user profile (typically name).
**Auth:** JWT

**Request**

```json
{
  "name": "Updated Owner Name"
}
```

**Response (200)**

```json
{
  "id": "f8788031-368b-4fcb-b1d1-4d20601b2625",
  "email": "owner@example.com",
  "name": "Updated Owner Name",
  "role": "OWNER",
  "organizationId": "9300918f-6f29-48a6-8e55-53f135dd6f9f"
}
```

---

### 7️⃣ `POST /users/change-password`

**Description:** Change current user password.
**Auth:** JWT

**Request**

```json
{
  "oldPassword": "password123",
  "newPassword": "NewStrongPassword!1"
}
```

**Response (200)**

```json
{
  "message": "Password updated successfully"
}
```

**Errors**

* `400 Bad Request` – old password incorrect

---

## ✅ TASKS

All task endpoints are **org-scoped** and **role-checked**.

---

### 8️⃣ `GET /tasks`

**Description:** List tasks visible to current user.
**Auth:** JWT
**Role:**

* VIEWER: can list
* ADMIN/OWNER: full manage rights

**Request**

```http
GET /api/tasks
Authorization: Bearer <token>
```

**Response (200)**

```json
[
  {
    "id": "4979f055-44ff-496a-97e5-a60670b45d83",
    "title": "First secure task",
    "description": "Test task created via API",
    "status": "TODO",
    "category": "WORK",
    "organization": {
      "id": "9300918f-6f29-48a6-8e55-53f135dd6f9f",
      "name": "Root Org"
    },
    "createdBy": {
      "id": "f8788031-368b-4fcb-b1d1-4d20601b2625",
      "email": "owner@example.com"
    },
    "assignedTo": null,
    "createdAt": "2025-12-02T14:56:48.927Z",
    "updatedAt": "2025-12-02T14:56:48.927Z"
  }
]
```

---

### 9️⃣ `POST /tasks`

**Description:** Create a new task within the user’s organization.
**Auth:** JWT
**Role:** ADMIN, OWNER (requires `MANAGE_TASKS`)

**Request**

```json
{
  "title": "Design RBAC System",
  "description": "Implement permissions and guards",
  "category": "WORK",
  "assignedToUserId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
}
```

**Response (201)**

```json
{
  "id": "de89aa22-5566-44aa-bb77-cceedd001122",
  "title": "Design RBAC System",
  "description": "Implement permissions and guards",
  "status": "TODO",
  "category": "WORK",
  "organization": {
    "id": "9300918f-6f29-48a6-8e55-53f135dd6f9f",
    "name": "Root Org"
  },
  "createdBy": {
    "id": "f8788031-368b-4fcb-b1d1-4d20601b2625",
    "email": "owner@example.com"
  },
  "assignedTo": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "email": "admin1@example.com"
  },
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T10:00:00.000Z"
}
```

**Errors**

* `403 Forbidden` – Viewer tries to create
* `400 Bad Request` – invalid category/status

---

### 🔟 `PUT /tasks/:id`

**Description:** Update an existing task (title, description, status, category, assignee).
**Auth:** JWT
**Role:** ADMIN, OWNER
**Org:** Task must belong to same org as user

**Request**

```json
{
  "title": "Design RBAC System (Updated)",
  "description": "Description updated",
  "status": "IN_PROGRESS",
  "category": "WORK",
  "assignedToUserId": "a1b2c3d4-5678-90ab-cdef-1234567890ab"
}
```

**Response (200)**

```json
{
  "id": "de89aa22-5566-44aa-bb77-cceedd001122",
  "title": "Design RBAC System (Updated)",
  "description": "Description updated",
  "status": "IN_PROGRESS",
  "category": "WORK",
  "assignedTo": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "email": "admin1@example.com"
  },
  "updatedAt": "2025-12-04T11:00:00.000Z"
}
```

**Errors**

* `404 Not Found` – task id not found in user’s org
* `403 Forbidden` – no permission to modify

---

### 1️⃣1️⃣ `DELETE /tasks/:id`

**Description:** Delete a task in the user’s organization.
**Auth:** JWT
**Role:** ADMIN, OWNER

**Request**

```http
DELETE /api/tasks/de89aa22-5566-44aa-bb77-cceedd001122
Authorization: Bearer <token>
```

**Response (200)**

```json
{
  "message": "Task deleted successfully"
}
```

**Errors**

* `404 Not Found` – task doesn’t exist / wrong org
* `403 Forbidden` – Viewer tries delete

---

## 📜 AUDIT LOG

---

### 1️⃣2️⃣ `GET /audit-log`

**Description:** Return audit log entries (who did what & when).
**Auth:** JWT
**Role:** ADMIN, OWNER (requires `VIEW_AUDIT_LOG`)

*(Depending on your current implementation this may log to console / file; below is a logical structure.)*

**Request**

```http
GET /api/audit-log
Authorization: Bearer <token>
```

**Response (200)**

```json
[
  {
    "timestamp": "2025-12-04T10:05:01.123Z",
    "userEmail": "owner@example.com",
    "action": "CREATE_TASK",
    "details": "Task 'Design RBAC System' created"
  },
  {
    "timestamp": "2025-12-04T10:20:45.456Z",
    "userEmail": "admin1@example.com",
    "action": "UPDATE_TASK",
    "details": "Task 'Design RBAC System' moved to IN_PROGRESS"
  }
]
```

**Errors**

* `403 Forbidden` – Viewer calling audit log

---

## ❌ Common Error Responses

### 401 – Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 – Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 – Not Found

```json
{
  "statusCode": 404,
  "message": "Task not found"
}
```

---

If you want, I can now:

* Turn this into a **Postman collection JSON**
* Or into an **OpenAPI (Swagger) spec** you can plug into Swagger UI and show during the interview.
