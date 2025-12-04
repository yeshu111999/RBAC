# Architecture Overview 

This document explains how the system is structured, how the data model looks, how access control works end-to-end, and how the API is designed. It also covers future extensions for roles, security, and performance.

---

## 1. Architecture Overview

### 1.1 NX Monorepo Layout and Rationale

The project uses a **monorepo layout** managed by NX:

```text
secure-task-manager/
├── api/                # NestJS backend app
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── organizations/
│   │   │   ├── tasks/
│   │   │   └── audit-log/
│   │   └── main.ts
│   └── ...
│
└── dashboard/          # Angular frontend app
    ├── src/
    │   ├── app/
    │   │   ├── auth/
    │   │   ├── tasks/
    │   │   └── profile/
    │   └── main.ts
    └── ...
