# System Role Credentials & Access Reference

This reference documents the active credentials for the system roles configured in the PostgreSQL database.

---

## 1. Sole Super Admin
* **Role**: `super_admin`
* **Email / Username**: `superadmin@company.com`
* **Password**: `SuperAdmin123!`
* **Status**: Active & Verified
* **Authority**:
  * Universal bypass across all 55+ platform permissions.
  * Full administrative control over user accounts, roles, and permission assignments.
  * Exclusive access to **Roles & Permissions Management** (`/dashboard/roles`).
  * Exclusive access to **Client Dashboard Access Control** (`/dashboard/client-access`).
  * Full access to **Administrative Audit Logs** (`/dashboard/audit-logs`).
  * Protected by database triggers against accidental deletion, deactivation, or demotion.

---

## 2. Content Manager (Content Management)
* **Role**: `editor`
* **Email / Username**: `content@company.com`
* **Password**: `Content123!`
* **Status**: Active & Verified
* **Authority**:
  * Content Management System (`/dashboard/cms`) — create, edit, publish web pages.
  * Company Blog (`/dashboard/blog`) — write, edit, and publish articles.
  * Portfolio Showcase (`/dashboard/portfolio`) — add and edit case studies and projects.
  * Media Library (`/dashboard/media`) — manage media assets, images, and documents.
  * Services & Catalog (`/dashboard/services`) — manage offered digital services.
  * Administrative modules (Users, Roles, System Settings, Audit Logs) are restricted and hidden.

---

## 3. Client User (Public Client Portal)
* **Role**: `client`
* **Email / Username**: `client@company.com`
* **Password**: `Client123!`
* **Status**: Active & Verified
* **Authority**:
  * Scoped exclusively to their own account data.
  * Accesses only the dashboard modules enabled by the Super Admin in Client Access Control.
  * View their projects (`/dashboard/projects`).
  * View and download their invoices (`/dashboard/finance/invoices`).
  * Submit and reply to support tickets (`/dashboard/support`).
  * Cannot access administrative settings, internal analytics, CRM leads, or user management.

---

## Database Seed File
To re-seed or verify these credentials at any time, run:
```sql
-- Located at: db/seed_demo_users.sql
psql -h localhost -U postgres -d sysmaira -f db/seed_demo_users.sql
```

