# CivicReport — Community-Based Issue Reporting System

A community-driven backend where citizens report local issues, authorities manage and resolve them, and analytics track trends.

**Stack:** Node.js · Express.js · PostgreSQL · Prisma ORM · JWT · bcryptjs · multer

---

## Workflows

| Branch | Actor | Purpose |
|---|---|---|
| `workflow-1` | Citizen | Register, report issues, upvote, comment |
| `workflow-2` | Admin | Review issues, update statuses, notify reporters |
| `workflow-3` | Admin + Public | Analytics dashboard, CSV export, saved reports |

---

## Git Branch Structure

| Branch | Contents |
|---|---|
| `workflow-1` | Citizen issue reporting |
| `workflow-2` | Admin review and status management |
| `workflow-3` | Analytics and reports |
| `merge-workflows` | All three workflows integrated |
| `main` | Final production-ready branch |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install nodemailer (required for forgot password email feature)
npm install nodemailer

# 3. Configure environment
cp .env.example .env
# Fill in all values in .env (see Environment Variables section below)

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Start server
node server.js
# Running on http://localhost:5001
```

**.env values:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/civicreport
JWT_SECRET=your_secret_key_here
PORT=5001
NODE_ENV=development
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password_here
```
**Getting Gmail App Password:**
1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to Security → App Passwords
4. Select app: Mail, device: Windows Computer
5. Copy the 16-character password into `EMAIL_PASS`

---

## Run with Docker (PostgreSQL)

```bash
docker run --name civicreport-db \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=civicreport \
  -p 5432:5432 -d postgres
```

---


## API Endpoints

### Workflow 1 — Citizen

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | No | Register (email + phone) |
| POST | `/api/users/login` | No | Login with email **or** phone |
| POST | `/api/issues` | Yes | Report issue (image upload supported) |
| GET | `/api/issues` | No | List issues — `?sortBy=priority`, `?area=`, `?category=` |
| GET | `/api/issues/nearby` | No | Issues near coordinates — `?latitude=&longitude=&radius=` |
| GET | `/api/issues/:id` | No | Issue detail |
| POST | `/api/upvotes` | Yes | Upvote an issue |
| DELETE | `/api/upvotes/:issueId` | Yes | Remove upvote |
| POST | `/api/comments` | Yes | Comment on an issue |
| GET | `/api/users/notifications` | Yes | Citizen notifications |

**Query params for GET /api/issues:**

| Param | Description |
|---|---|
| `category` | Filter by category (Garbage, Water, Road, Electricity) |
| `status` | Filter by status |
| `area` | Partial match on address field |
| `sortBy` | `upvoteCount` for priority order, default is newest first |
| `userId` | Filter by reporter |

**Report an issue (multipart/form-data for image upload):**
```json
{
  "title": "Overflowing garbage bins",
  "description": "Bins overflowing near bus stop for 5 days",
  "category": "Garbage",
  "latitude": 24.8607,
  "longitude": 67.0011,
  "address": "Main Street, Downtown",
  "image": "<file upload OR image URL string>"
}
```

Images are served at: `GET /uploads/issues/<filename>`

**Nearby issues:**
```
GET /api/issues/nearby?latitude=24.8607&longitude=67.0011&radius=5
```

---

### Workflow 2 — Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/register` | No | Create admin account |
| POST | `/api/admin/login` | No | Admin login |
| GET | `/api/admin/issues` | Admin | List issues — `?area=`, `?category=`, `?status=`, `?dateFrom=`, `?dateTo=`, `?sortBy=upvoteCount` |
| GET | `/api/admin/issues/:id` | Admin | Full detail + status history |
| PUT | `/api/admin/issues/:id` | Admin | Update status + remarks → auto-notifies reporter & upvoters |
| GET | `/api/status-logs/issue/:issueId` | Admin | Status change history |
| GET | `/api/notifications` | Admin | Admin notifications |

**Query params for GET /api/admin/issues:**

| Param | Description |
|---|---|
| `category` | Filter by category |
| `status` | Filter by status |
| `area` | Partial match on address |
| `dateFrom` | ISO date filter start |
| `dateTo` | ISO date filter end |
| `sortBy` | `upvoteCount` or `status` or default `createdAt` |

**Update status:**
```json
{
  "newStatus": "In Progress",
  "remarks": "Assigned to municipal waste team"
}
```

**Valid statuses:** `Pending` → `In Progress` → `Resolved` / `Rejected`

---

### Workflow 3 — Analytics

**Public:**

| Endpoint | Description |
|---|---|
| `GET /api/analytics/overview` | Total issues, status breakdown, total upvotes |
| `GET /api/analytics/by-category` | Issue count per category |
| `GET /api/analytics/top-categories` | Top N categories — `?limit=5` |
| `GET /api/analytics/by-area` | Issue count per neighbourhood |
| `GET /api/analytics/trends` | Daily issue count over time |
| `GET /api/analytics/category-summary` | Summary panel — requires `?category=` |

**Admin only:**

| Endpoint | Description |
|---|---|
| `GET /api/analytics/resolution-time` | Average resolution time |
| `GET /api/analytics/resolution-time-by-category` | Per-category resolution time |
| `GET /api/analytics/export` | CSV download — `?columns=issueId,category,status,...` |
| `POST /api/reports` | Save a report |
| `GET /api/reports` | List saved reports |
| `GET /api/reports/:id/download` | Download saved report as CSV |
| `PUT /api/reports/:id` | Update / regenerate report |
| `DELETE /api/reports/:id` | Delete report |


**Common query params (all analytics endpoints):**

| Param | Description |
|---|---|
| `dateFrom` | ISO date e.g. `2026-01-01` |
| `dateTo` | ISO date e.g. `2026-12-31` |
| `category` | e.g. `Garbage`, `Water`, `Road` |
| `status` | `Pending`, `In Progress`, `Resolved`, `Rejected` |
| `area` | Partial match on address |

**CSV export column selection:**
```
GET /api/analytics/export?columns=issueId,category,status,reportDate
```
Valid column keys: `issueId`, `category`, `locationArea`, `status`, `reportDate`, `resolutionDate`, `upvoteCount`

**Create report:**
```json
{
  "title": "April 2026 — Garbage Issues",
  "filters": {
    "dateFrom": "2026-04-01",
    "dateTo": "2026-04-30",
    "category": "Garbage"
  }
}
```

**Update and regenerate:**
```json
{
  "title": "Updated Title",
  "filters": { "status": "Resolved" },
  "regenerate": true
}
```

---

## Error Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / missing or invalid fields |
| 401 | Missing, expired, or invalid JWT |
| 403 | Valid JWT but wrong role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 500 | Internal server error |
