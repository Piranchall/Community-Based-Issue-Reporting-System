# CivicReport - Community-Based Issue Reporting System Backend

A Node.js/Express backend application for a community-based issue reporting system utilizing PostgreSQL database and Prisma ORM.

## Project Overview

CivicReport enables citizens to report local issues (garbage, water, electricity, roads, etc.) with geolocation support, community upvoting, and image uploads. The backend provides a RESTful API with full CRUD operations for issues, user management, upvotes, and comments.

## Tech Stack

- **Backend Framework**: Express.js (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Image Upload**: multer

## Project Structure

```
Community-Based-Issue-Reporting-System/
├── prisma/
│   └── schema.prisma          # Prisma database schema
├── services/
│   ├── userService.js         # User business logic
│   ├── issueService.js        # Issue business logic
│   ├── upvoteService.js       # Upvote business logic
│   └── commentService.js      # Comment business logic
├── routes/
│   ├── users.js               # User authentication endpoints
│   ├── issues.js              # Issue CRUD endpoints
│   ├── upvotes.js             # Upvote endpoints
│   └── comments.js            # Comment endpoints
├── middleware/
│   └── authMiddleware.js      # JWT authentication middleware
├── server.js                   # Main server file
├── package.json               # Project dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Community-Based-Issue-Reporting-System.git
cd Community-Based-Issue-Reporting-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/civic_report"
JWT_SECRET="your_secure_jwt_secret_key_here"
PORT=5000
NODE_ENV="development"
```

### 4. Setup PostgreSQL Database

Install PostgreSQL and create a database:

```bash
createdb civic_report
```

Or using PostgreSQL shell:

```sql
CREATE DATABASE civic_report;
```

### 5. Run Prisma Migrations

```bash
npm run migrate
```

This command will:
- Create all necessary tables in PostgreSQL
- Set up relationships and indexes
- Generate Prisma Client

### 6. Start the Server

For development with auto-reload:

```bash
npm run dev
```

For production:

```bash
npm start
```

Server will run on `http://localhost:5000` (or your configured PORT)

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

Most protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## User Endpoints

### 1. Register User
- **POST** `/users/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "phone": "03001234567",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "cuid123",
        "email": "user@example.com",
        "phone": "03001234567",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatar.jpg",
        "createdAt": "2024-03-24T10:00:00Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```

### 2. Login User
- **POST** `/users/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Login successful",
    "data": {
      "user": {
        "id": "cuid123",
        "email": "user@example.com",
        "phone": "03001234567",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```

### 3. Get Current User Profile
- **GET** `/users/profile` (Protected)
- **Response** (200):
  ```json
  {
    "message": "User profile fetched successfully",
    "data": {
      "id": "cuid123",
      "email": "user@example.com",
      "phone": "03001234567",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg",
      "createdAt": "2024-03-24T10:00:00Z",
      "updatedAt": "2024-03-24T10:30:00Z"
    }
  }
  ```

### 4. Get User by ID
- **GET** `/users/:userId`
- **Response** (200): Same as Get Profile

### 5. Update User Profile
- **PUT** `/users/profile` (Protected)
- **Body**:
  ```json
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "03009876543",
    "avatar": "https://example.com/new-avatar.jpg"
  }
  ```
- **Response** (200): Updated user object

### 6. Change Password
- **PUT** `/users/change-password` (Protected)
- **Body**:
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

### 7. Delete User Account
- **DELETE** `/users/account` (Protected)
- **Response** (200):
  ```json
  {
    "message": "User account deleted successfully",
    "data": {
      "id": "cuid123",
      "email": "user@example.com"
    }
  }
  ```

---

## Issue Endpoints

### 1. Create Issue
- **POST** `/issues` (Protected)
- **Body**:
  ```json
  {
    "title": "Broken Water Pipe",
    "description": "Water pipe burst near the main road",
    "category": "Water",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "address": "Downtown, Los Angeles",
    "image": "https://example.com/issue-photo.jpg"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Issue created successfully",
    "data": {
      "id": "issue123",
      "title": "Broken Water Pipe",
      "description": "Water pipe burst near the main road",
      "category": "Water",
      "status": "Pending",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "address": "Downtown, Los Angeles",
      "image": "https://example.com/issue-photo.jpg",
      "upvoteCount": 0,
      "user": {
        "id": "user123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "upvotes": [],
      "comments": [],
      "createdAt": "2024-03-24T10:00:00Z"
    }
  }
  ```

### 2. Get All Issues
- **GET** `/issues`
- **Query Parameters** (Optional):
  - `category`: Filter by category (e.g., "Garbage", "Water", "Electricity", "Road")
  - `status`: Filter by status (e.g., "Pending", "In Progress", "Resolved")
  - `userId`: Filter by user who created the issue
- **Example**: `GET /issues?category=Water&status=Pending`
- **Response** (200):
  ```json
  {
    "message": "Issues fetched successfully",
    "count": 5,
    "data": [
      {
        "id": "issue123",
        "title": "Broken Water Pipe",
        "description": "Water pipe burst near the main road",
        "category": "Water",
        "status": "Pending",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "upvoteCount": 3,
        "user": {...},
        "upvotes": [...],
        "comments": [...]
      }
    ]
  }
  ```

### 3. Get Issue by ID
- **GET** `/issues/:issueId`
- **Response** (200): Single issue object with all details

### 4. Update Issue
- **PUT** `/issues/:issueId` (Protected)
- **Body** (All optional):
  ```json
  {
    "title": "Updated Title",
    "description": "Updated description",
    "category": "Electricity",
    "status": "In Progress",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "address": "New Address",
    "image": "https://example.com/new-photo.jpg"
  }
  ```
- **Response** (200): Updated issue object
- **Note**: Only the issue creator can update

### 5. Delete Issue
- **DELETE** `/issues/:issueId` (Protected)
- **Response** (200):
  ```json
  {
    "message": "Issue deleted successfully",
    "data": {...}
  }
  ```
- **Note**: Only the issue creator can delete

### 6. Get Nearby Issues
- **GET** `/issues/nearby?latitude=34.0522&longitude=-118.2437&radius=5`
- **Query Parameters**:
  - `latitude`: User's latitude (required)
  - `longitude`: User's longitude (required)
  - `radius`: Search radius in kilometers (optional, default: 5)
- **Response** (200): Array of issues within the radius

---

## Upvote Endpoints

### 1. Add Upvote
- **POST** `/upvotes` (Protected)
- **Body**:
  ```json
  {
    "issueId": "issue123"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Upvote added successfully",
    "data": {
      "id": "upvote123",
      "user": {
        "id": "user123",
        "email": "user@example.com"
      },
      "createdAt": "2024-03-24T10:15:00Z"
    }
  }
  ```

### 2. Get Upvotes for Issue
- **GET** `/upvotes/issue/:issueId`
- **Response** (200):
  ```json
  {
    "message": "Upvotes fetched successfully",
    "count": 3,
    "data": [
      {
        "id": "upvote1",
        "user": {...},
        "createdAt": "2024-03-24T10:00:00Z"
      }
    ]
  }
  ```

### 3. Check if User Upvoted
- **GET** `/upvotes/check/:issueId` (Protected)
- **Response** (200):
  ```json
  {
    "message": "Upvote status fetched successfully",
    "data": {
      "hasUpvoted": true
    }
  }
  ```

### 4. Get User's Upvoted Issues
- **GET** `/upvotes/user/my-upvotes` (Protected)
- **Response** (200): Array of issues upvoted by the user

### 5. Remove Upvote
- **DELETE** `/upvotes/:issueId` (Protected)
- **Response** (200):
  ```json
  {
    "message": "Upvote removed successfully"
  }
  ```

---

## Comment Endpoints

### 1. Create Comment
- **POST** `/comments` (Protected)
- **Body**:
  ```json
  {
    "issueId": "issue123",
    "text": "This issue needs immediate attention!"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Comment created successfully",
    "data": {
      "id": "comment123",
      "text": "This issue needs immediate attention!",
      "user": {...},
      "createdAt": "2024-03-24T10:20:00Z"
    }
  }
  ```

### 2. Get Comments for Issue
- **GET** `/comments/issue/:issueId`
- **Response** (200):
  ```json
  {
    "message": "Comments fetched successfully",
    "count": 5,
    "data": [
      {
        "id": "comment1",
        "text": "Comment text",
        "user": {...},
        "createdAt": "2024-03-24T10:20:00Z"
      }
    ]
  }
  ```

### 3. Get Single Comment
- **GET** `/comments/:commentId`
- **Response** (200): Single comment object

### 4. Update Comment
- **PUT** `/comments/:commentId` (Protected)
- **Body**:
  ```json
  {
    "text": "Updated comment text"
  }
  ```
- **Response** (200): Updated comment object
- **Note**: Only the comment author can update

### 5. Delete Comment
- **DELETE** `/comments/:commentId` (Protected)
- **Response** (200):
  ```json
  {
    "message": "Comment deleted successfully"
  }
  ```
- **Note**: Only the comment author can delete

### 6. Get Comments by User
- **GET** `/comments/user/:userId`
- **Response** (200): Array of comments posted by the user

---

## Database Schema

### Users Table
```
- id (String, CUID, Primary Key)
- email (String, Unique)
- phone (String, Unique)
- password (String, encrypted)
- firstName (String, Optional)
- lastName (String, Optional)
- avatar (String, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### Issues Table
```
- id (String, CUID, Primary Key)
- title (String)
- description (String)
- category (String)
- status (String, Default: "Pending")
- image (String, Optional)
- latitude (Float)
- longitude (Float)
- address (String, Optional)
- upvoteCount (Integer, Default: 0)
- userId (String, Foreign Key)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### Upvotes Table
```
- id (String, CUID, Primary Key)
- userId (String, Foreign Key)
- issueId (String, Foreign Key)
- createdAt (DateTime)
- Unique Constraint: (userId, issueId)
```

### Comments Table
```
- id (String, CUID, Primary Key)
- text (String)
- userId (String, Foreign Key)
- issueId (String, Foreign Key)
- createdAt (DateTime)
- updatedAt (DateTime)
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (permission denied)
- **404**: Not Found
- **500**: Internal Server Error

Error response format:

```json
{
  "error": "Error description"
}
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/civic_report |
| JWT_SECRET | Secret key for JWT signing | your_secure_key_here |
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development / production |

---

## Running with Prisma Studio

View and manage your database visually:

```bash
npm run studio
```

This opens Prisma Studio at `http://localhost:5555`

---

## Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `psql -l`

### Migration Errors
```bash
# Reset database (careful - drops all data)
npx prisma migrate reset

# Re-run migrations
npm run migrate
```

### Port Already in Use
```bash
# Change PORT in .env or use:
PORT=3000 npm run dev
```

### JWT Token Errors
- Ensure JWT_SECRET is set in .env
- Token may have expired (expires in 24 hours)
- Re-login to get a new token

---

## License

ISC

---

## Support

For issues or questions, contact the development team or open an GitHub issue.
