# CivicReport — Community-Based Issue Reporting System

A full-stack web application that enables citizens to report, track, and upvote public issues in their neighbourhood, while giving city administrators a real-time dashboard to triage, resolve, and analyse reported problems across the city.

---

## Project Overview

CivicReport bridges the gap between citizens and local government. Citizens submit issues (potholes, garbage, water leaks, broken streetlights, etc.) with photos and GPS location. Admins review, assign, and update statuses. Analytics and a density map give administrators data-driven insight into which areas need the most attention.

The system is built across three integrated workflows:

| Workflow | Role | Responsibility |
|---|---|---|
| WF1 | Citizen frontend | Issue reporting, tracking, upvoting, notifications |
| WF2 | Admin frontend | Issue triage, status management, team operations |
| WF3 | Analytics | Overview charts, filtered analytics, density map, CSV export |

---

## Team Contributions

| Member | Responsibilities |
|---|---|
| **Muhammad Hussain 29004** | WF1 — Citizen frontend: authentication, dashboard, issue reporting, comments, upvotes, notifications, profile |
| **Muhammad Hussain 28985** | WF2 — Admin frontend: all issues dashboard, issue detail, status management, notifications, team management |
| **Piranchal 29050** | WF3 — Analytics frontend and backend: overview charts, filtered analytics, map view, CSV export, saved reports |
| **All 3 Members** | Integration: merging all three workflows, shared component system, bug fixes, seed data, documentation |

## Features

### Citizen (WF1)
- Register and login with email or phone number
- Forgot password and reset via token-verified email
- Dashboard with summary cards (total, pending, resolved, in-progress) and nearby issues feed
- Report an issue with title, category, description, GPS location, address, and optional photo
- View full issue detail with status history, comments, and upvote count
- Edit and delete own reports
- Upvote community issues to signal priority
- Add and remove comments on any issue
- Real-time notification bell for status updates on reported or upvoted issues
- Analytics overview — read-only access to city-wide trend data
- Profile management (update details, change password)

### Admin (WF2)
- Separate admin login and password reset flow
- All Issues dashboard with KPI cards (total, pending, in-progress, resolved, rejected, upvotes)
- Priority column calculated from GPS density + upvote score (Haversine algorithm)
- Filter issues by status, category, area, date range, and free-text search
- Click-through to full issue detail — update status, add remarks, assign authority
- Status logs — full audit trail of every status change across all issues
- Notifications — real-time alerts for new citizen reports and status events
- Team management — create additional admin accounts
- Admin profile page with account details and password change
- Saved Reports — view, download as CSV, or delete analytics snapshots

### Analytics (WF3)
- Analytics Overview with stat cards (total, pending, in-progress, resolved, rejected, upvotes)
- Issues by Category — horizontal bar chart
- Issues Over Time — smooth line chart with area fill and auto-scaled axes
- Top 5 Categories — ranked list with percentage share
- Average Resolution Time by Category — horizontal bar chart (admin only)
- Filtered Analytics — drill into a specific category with status breakdown and area summary
- Map View — geographic bubble density map showing issue concentration per neighbourhood
- Export CSV — configurable column selection with date and filter options (admin only)
- Saved Reports — snapshot reports persisted to database with CSV download

---

## Frameworks and Major Libraries

### Frontend Frameworks
| Framework | Purpose |
|---|---|
| React 19 | Component-based UI framework |
| Vite 6 | Frontend build tool and dev server |
| React Router DOM 7 | Client-side routing and navigation |

### Frontend Libraries
| Library | Purpose |
|---|---|
| Vanilla CSS (custom) | Design system — tokens, layout, component styles |

### Backend Frameworks
| Framework | Purpose |
|---|---|
| Node.js | JavaScript runtime environment |
| Express.js | Web application and REST API framework |

### Backend Libraries
| Library | Purpose |
|---|---|
| Prisma ORM | Type-safe database access and migrations |
| PostgreSQL | Relational database |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT-based authentication (citizen and admin) |
| Multer | Multipart file upload handling |
| Nodemailer | Transactional email for password reset |

---

## Setup Steps

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or managed)

### 1. Clone the repository
```bash
git clone https://github.com/Piranchall/Community-Based-Issue-Reporting-System.git
cd Community-Based-Issue-Reporting-System
git checkout main
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Configure backend environment
Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
JWT_SECRET="your_jwt_secret_here"
PORT=5001

EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your_email_user"
EMAIL_PASS="your_email_password"
EMAIL_FROM="noreply@civicreport.local"
```

### 4. Run database migrations
```bash
npx prisma migrate deploy
```

### 5. Seed the database
```bash
npx prisma db seed
```

This creates:
- 8 citizen accounts (`ali@citizen.com` … `wei@citizen.com`, password: `pass123`)
- 5 admin accounts (`admin@city.gov`, `roads@city.gov`, `env@city.gov`, `water@city.gov`, `electric@city.gov`, password: `admin123`)
- 54 issues across 10 Kuala Lumpur neighbourhoods with varied density, upvotes, status logs, comments, and notifications

### 6. Start the backend server
```bash
npm run dev
```

Backend runs at `http://localhost:5001`.

### 7. Install and configure frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5001
```

### 8. Start the frontend
```bash
npm run dev
```

Frontend runs at `http://localhost:5174`.

---

## Default Accounts

| Role | Email | Password |
|---|---|---|
| Citizen | ali@citizen.com | pass123 |
| Admin | admin@city.gov | admin123 |

---

## Project Structure
 
```
├── server.js                  # Express entry point
├── routes/                    # API route handlers
│   ├── auth.js                # Citizen auth (register, login, reset)
│   ├── admin.js               # Admin auth and profile
│   ├── issues.js              # Citizen issue CRUD
│   ├── Adminissues.js         # Admin issue management
│   ├── analytics.js           # Analytics endpoints (WF3)
│   ├── reports.js             # Saved reports CRUD (WF3)
│   ├── notifications.js       # Notification management
│   ├── statusLogs.js          # Status change history
│   ├── upvotes.js             # Issue upvoting
│   ├── comments.js            # Issue comments
│   └── users.js               # Citizen profile
├── services/                  # Business logic layer
├── middleware/                # Auth middleware (citizen + admin)
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.js                # Rich seed dataset
│   └── migrations/            # Migration history
├── uploads/                   # Uploaded issue images
└── frontend/                  # React frontend (see frontend/README.md)
    └── src/
        ├── pages/             # Page components
        ├── components/        # Shared UI components
        ├── lib/               # API client, auth helpers, utilities
        └── styles/            # CSS design tokens and global styles
```
 
---
