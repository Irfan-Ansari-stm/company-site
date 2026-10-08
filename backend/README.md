# Enterprise Platform — Express.js Backend

Complete REST API backend covering all schemas: auth, CMS, services, portfolio, blog, CRM, projects, finance, clients, support, HR, media, notifications, analytics, marketing, AI, and system administration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js 4 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) + 2FA (TOTP) |
| File Storage | AWS S3 / Cloudflare R2 (local fallback) |
| Email | Nodemailer (SMTP / SendGrid) |
| AI | OpenAI API |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |

---

## Project Structure

```
src/
├── index.js                  # Entry point — mounts all routes
├── config/
│   ├── database.js           # PostgreSQL pool + helpers
│   └── logger.js             # Winston logger
├── middleware/
│   ├── auth.js               # JWT auth, permissions, roles
│   ├── common.js             # Pagination, upload, rate limiting
│   └── errorHandler.js       # Central error handler, AppError
├── routes/
│   ├── auth.js               # Register, login, 2FA, refresh, OAuth
│   ├── users.js              # Users + Roles + Permissions
│   ├── cms.js                # Pages, sections, menus, redirects, forms, testimonials, popups
│   ├── services.js           # Services, categories, packages, industries, solutions
│   ├── portfolio.js          # Projects, gallery, metrics
│   ├── blog.js               # Posts, categories, tags, resources
│   ├── crm.js                # Leads, activities, meetings, proposals, accounts, contacts, pipelines
│   ├── projects.js           # Projects, tasks, sprints, time entries
│   ├── finance.js            # Invoices, payments, expenses, subscriptions, quotes, reports
│   ├── clients.js            # Client management, portal, contacts, notes
│   ├── support.js            # Tickets, replies, knowledge base
│   ├── hr.js                 # Jobs, applications, interviews, team members
│   ├── media.js              # Media library, folders, file upload
│   ├── notifications.js      # Notifications + Analytics
│   ├── system.js             # Settings, audit logs, API keys, webhooks, email templates, feature flags
│   ├── marketing.js          # Subscribers, mailing lists, campaigns, coupons
│   └── ai.js                 # AI conversations, content generation
└── utils/
    └── helpers.js            # JWT, bcrypt, email, slug, response helpers
```

---

## Quick Start (Without Docker)

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally

### 2. Setup

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and secrets

# Load the SQL schema into your PostgreSQL database
psql -U your_user -d your_db -f sql/part1.sql
psql -U your_user -d your_db -f sql/part2.sql

# Start in development mode (with auto-reload)
npm run dev

# Start in production mode
npm start
```

---

## Quick Start (With Docker)

```bash
# Copy and configure environment
cp .env.example .env

# Copy SQL files to ./sql/ folder
mkdir -p sql
cp /path/to/part1.sql sql/
cp /path/to/part2.sql sql/

# Start all services (API + PostgreSQL + Redis)
docker compose up -d

# Check logs
docker compose logs -f api

# Stop all services
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v
```

---

## Environment Variables

See `.env.example` for the full list. Critical ones:

| Variable | Description |
|---|---|
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) |
| `STORAGE_PROVIDER` | `s3` or `local` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | If using S3 |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email delivery |
| `OPENAI_API_KEY` | For AI features |

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns access + refresh tokens) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (invalidate session) |
| POST | `/auth/logout-all` | Logout all sessions |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |
| GET | `/auth/verify-email` | Verify email address |
| GET | `/auth/me` | Current user profile |
| PATCH | `/auth/me` | Update profile |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/2fa/setup` | Generate 2FA QR code |
| POST | `/auth/2fa/enable` | Enable 2FA |
| POST | `/auth/2fa/disable` | Disable 2FA |
| POST | `/auth/2fa/verify` | Verify 2FA code |
| GET | `/auth/sessions` | List active sessions |
| DELETE | `/auth/sessions/:id` | Revoke session |
| POST | `/auth/oauth/callback` | OAuth provider callback |

### Users
`GET/POST /users` · `GET/PATCH/DELETE /users/:id` · `POST /users/:id/reset-password` · `GET /users/:id/activity`

### Roles & Permissions
`GET/POST /roles` · `PATCH/DELETE /roles/:id` · `GET/PUT /roles/:id/permissions` · `POST/DELETE /roles/:id/users`
`GET/POST /permissions`

### CMS
`GET/POST/PATCH/DELETE /cms/pages` · `/cms/pages/:id/sections` · `/cms/pages/:id/revisions`
`GET/POST/PATCH /cms/seo` · `GET/POST/PATCH/DELETE /cms/menus` · `GET/POST/DELETE /cms/redirects`
`GET/POST /cms/forms` · `POST /cms/forms/:id/submit` · `GET /cms/forms/:id/submissions`
`GET/POST/PATCH/DELETE /cms/testimonials` · `GET/POST/PATCH /cms/popups`

### Services
`GET/POST/PATCH/DELETE /services` · `/services/:id/features` · `/services/:id/packages`
`GET/POST/PATCH/DELETE /services/categories`
`GET/POST/PATCH/DELETE /industries` · `/solutions`

### Portfolio
`GET/POST/PATCH/DELETE /portfolio` · `/portfolio/:id/gallery` · `/portfolio/:id/metrics`

### Blog
`GET/POST/PATCH/DELETE /blog/posts` · `POST /blog/posts/:id/like`
`GET/POST/PATCH/DELETE /blog/categories` · `GET/POST /blog/tags`
`GET/POST /blog/resources` · `POST /blog/resources/:id/download`

### CRM
`GET/POST/PATCH/DELETE /crm/leads` · `/crm/leads/public` (public form)
`GET/POST/PATCH/DELETE /crm/leads/:id/notes` · `/crm/leads/:id/activities`
`POST /crm/leads/:id/convert` · `POST /crm/leads/:id/assign`
`GET/POST/PATCH/DELETE /crm/meetings` · `/crm/proposals`
`GET/POST/PATCH /crm/accounts` · `/crm/contacts` · `/crm/pipelines`
Analytics: `/crm/leads/pipeline` · `/crm/leads/funnel` · `/crm/leads/source-stats`

### Projects
`GET/POST/PATCH/DELETE /projects` · `/projects/:id/members` · `/projects/:id/milestones` · `/projects/:id/files`
`GET/POST/PATCH/DELETE /tasks` · `/tasks/:id/comments` · `/tasks/:id/attachments`
`GET/POST/PATCH /sprints`
`GET/POST/PATCH/DELETE /time-entries` · `/time-entries/summary`

### Finance
`GET/POST/PATCH/DELETE /finance/invoices` · `POST /finance/invoices/:id/send`
`GET/POST/PATCH /finance/payments`
`GET/POST/PATCH/DELETE /finance/expenses`
`GET/POST/PATCH /finance/subscriptions` · `/finance/subscription-plans`
`GET/POST/PATCH /finance/quotes`
Reports: `/finance/reports/revenue` · `/finance/reports/profitability` · `/finance/reports/aging` · `/finance/reports/cash-flow`

### Clients
`GET/POST/PATCH/DELETE /clients` · `/clients/:id/contacts` · `/clients/:id/notes` · `/clients/:id/portal`

### Support
`GET/POST/PATCH /support/tickets` · `/support/tickets/:id/replies` · `POST /support/tickets/:id/rate`
`GET/POST /support/kb` (knowledge base)

### HR
`GET/POST /hr/departments` · `GET/POST/PATCH/DELETE /hr/jobs` · `POST /hr/jobs/:id/apply` (public)
`GET/PATCH /hr/applications` · `POST /hr/applications/:id/interviews` · `/hr/applications/:id/notes`
`GET/POST/PATCH/DELETE /hr/team`

### Media
`GET /media` · `POST /media/upload` · `POST /media/upload-multiple` · `PATCH/DELETE /media/:id`
`GET/POST/PATCH/DELETE /media/folders`

### Notifications
`GET /notifications` · `GET /notifications/count` · `POST /notifications/read/:id`
`POST /notifications/read-all` · `GET/PUT /notifications/preferences` · `POST /notifications/push-subscribe`

### Analytics
`POST /analytics/pageview` · `POST /analytics/event` · `GET /analytics/dashboard`
`GET /analytics/traffic-sources` · `GET /analytics/conversion` · `GET /analytics/realtime`

### Marketing
`GET/PATCH /marketing/subscribers` · `POST /marketing/subscribers/subscribe` · `POST /marketing/subscribers/unsubscribe`
`GET/POST/PATCH /marketing/lists` · `/marketing/lists/:id/subscribers`
`GET/POST/PATCH/DELETE /marketing/campaigns` · `POST /marketing/campaigns/:id/send`
`GET/POST/PATCH /marketing/coupons` · `POST /marketing/coupons/validate`

### AI
`GET/POST/DELETE /ai/conversations` · `POST /ai/chat`
`POST /ai/generate/proposal` · `POST /ai/generate/blog` · `POST /ai/generate/email`
`GET /ai/usage`

### System
`GET/PUT /system/settings` · `PUT /system/settings/:key` · `GET /system/settings/public`
`GET /system/audit-logs` · `GET/POST/DELETE /system/api-keys`
`GET/POST/PATCH/DELETE /system/webhooks` · `GET /system/webhooks/:id/deliveries`
`GET/POST/PATCH /system/email-templates`
`GET/POST/PATCH /system/feature-flags`
`GET /system/health`

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Access tokens expire in 15 minutes. Use `POST /auth/refresh` with the refresh token to rotate.

---

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

Paginated responses:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Errors:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## Pagination & Filtering

Append to any list endpoint:
```
?page=1&limit=20&sort_by=created_at&sort_dir=DESC&search=query
```

---

## Notes

- All timestamps are returned in UTC ISO 8601 format
- UUIDs are used as primary keys throughout
- Soft deletes are used (deleted_at column) where applicable
- Role-based access control with granular per-permission checks
- Two-factor authentication using TOTP (Google Authenticator compatible)
- File uploads support both S3/R2 (production) and local filesystem (development)
- AI features require an OpenAI API key in `.env`
