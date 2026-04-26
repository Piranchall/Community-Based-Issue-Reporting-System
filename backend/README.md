# CivicReport - Community-Based Issue Reporting System

## Project Overview
CivicReport is a full-stack web application where citizens can report public issues (such as garbage, water, electricity, and road problems), attach evidence, and track resolution progress. The platform supports transparent community participation through upvotes and comments, helping prioritize urgent neighborhood concerns.

## Features
- User authentication and session management
  - Register (email/phone/password)
  - Login (email or phone)
  - Logout
  - Forgot password and reset password with token verification
- Citizen dashboard
  - Summary cards for total issues, pending, resolved, and personal reports
  - Recent issue listing with status and quick navigation
- Issue management workflow
  - Create issue reports with title, category, description, location, address, and optional image upload
  - Read issue details with metadata, comments, and upvote count
  - Update own reports
  - Delete own reports with confirmation
- Community collaboration
  - Upvote issues
  - Add and remove comments
- Profile management
  - Update profile details
  - Change password
- UI and UX polish
  - Wireframe-aligned views
  - Responsive layouts for desktop and mobile
  - Loading states, success/error alerts, and confirmation dialogs

## Frameworks and Major Libraries Used
### Frontend
- React (with Vite)
- React Router DOM
- Vanilla CSS (custom responsive design system)

### Backend
- Node.js + Express.js
- Prisma ORM
- PostgreSQL
- JWT for authentication
- Multer for file uploads
- Nodemailer for password reset emails

## Project Structure
- backend (root)
  - `server.js`
  - `routes/`
  - `services/`
  - `middleware/`
  - `prisma/`
- frontend
  - `frontend/src/pages/`
  - `frontend/src/components/`
  - `frontend/src/context/`
  - `frontend/src/lib/`

## Setup Steps
### 1. Clone and install backend dependencies
```bash
npm install
```

### 2. Configure environment variables
Create a `.env` file in the project root (or update existing values):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
JWT_SECRET="your_jwt_secret"
PORT=5001

# Email service values used in password reset flow
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your_email_user"
EMAIL_PASS="your_email_password"
EMAIL_FROM="noreply@civicreport.local"
```

### 3. Run database migrations
```bash
npm run migrate
```

### 4. Start backend server
```bash
npm run dev:backend
```

### 5. Setup frontend
```bash
cd frontend
npm install
```

Create frontend environment file:

```bash
# from /frontend
copy .env.example .env
```

Set API base URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_embed_api_key
```

`VITE_GOOGLE_MAPS_API_KEY` is optional. If omitted, the app still renders an embedded map using the public Google maps embed URL.

### 6. Start frontend
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Deployment Readiness Notes
- Build frontend for production:
```bash
npm run build:frontend
```
- Configure CORS and environment variables for production hostnames.
- Use a managed PostgreSQL instance in production.
- Serve frontend build through a static host or reverse proxy.

## Team Contributions
Update this section with your actual group members before submission:
- Member 1: Backend API design, Prisma schema, authentication routes
- Member 2: Issue, comment, and upvote workflow implementation
- Member 3: Frontend wireframe implementation and responsive styling
- Member 4: Integration testing, documentation, and deployment setup

## Milestone 4 Checklist Mapping
- Complete Functionality: authentication, CRUD modules, and frontend-backend integration implemented
- Frontend Polish and Styling Consistency: unified style system and responsive components
- Framework Integration and Architecture: React frontend integrated with Express/Prisma backend
- Validation, Routing, and Error Handling: frontend and backend validation with route guards and feedback states
- README Documentation: full setup, structure, and contribution template included
