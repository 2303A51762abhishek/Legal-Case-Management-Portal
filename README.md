# JurisFlow — Legal Case & Court Hearing Management Portal

**A Modern Full-Stack & DevOps Legal Practice Management System**

- **Student:** MAMILLAPALLY ABHISHEK
- **Enrollment / Roll Number:** 2303A51762
- **Course & Semester:** B.Tech IV Year I Semester
- **Subject:** DevOps & Full Stack
- **Academic Year:** 2026–2027

---

## 1. Technology Stack

- **Frontend:** React.js (Vite), Tailwind CSS, Lucide React, Axios, React Router DOM
- **Backend:** Node.js, Express.js
- **Database:** MongoDB & Mongoose (7 Collections with ObjectId Relationships & Indexes)
- **Security:** JSON Web Tokens (JWT), bcryptjs password hashing, Helmet headers, CORS policies
- **DevOps:** Git, GitHub, Docker, Kubernetes

---

## 2. Project Architecture

```
legal-case-management-portal/
├── frontend/                     # React.js SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Sidebar, Navbar, Badges, StatCards
│   │   │   └── dashboard/        # Admin, Lawyer, Client, Clerk Views
│   │   ├── context/              # AuthContext & Role Switching
│   │   ├── layouts/              # DashboardLayout
│   │   ├── pages/                # Cases, Hearings, Tasks, Reports, Login
│   │   └── services/             # Axios API Client
│   └── package.json
│
├── backend/                      # Node.js + Express.js REST API
│   ├── src/
│   │   ├── config/               # Environment & MongoDB Connection (db.js, env.js)
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middleware/           # JWT Auth, RBAC guards, Centralized Error Handling
│   │   ├── models/               # 7 Mongoose Schemas (User, Client, Case, Hearing, Task, Doc, Notif)
│   │   ├── routes/               # Modular REST API endpoints
│   │   ├── services/             # JWT & Business Services
│   │   ├── utils/                # Password hashing, standardized responses, seed script
│   │   ├── uploads/              # Authorized case documents vault
│   │   ├── app.js                # Express Application Configuration
│   │   └── server.js             # HTTP Server & DB Connection Entrypoint
│   ├── .env.example              # Environment variables template
│   └── package.json
│
├── docker/                       # Dockerfiles and Compose configs (Phase 12)
├── kubernetes/                   # Deployments, Services, ConfigMaps (Phase 13)
├── docs/                         # Architecture, API & Viva Voce Q&A docs
└── README.md
```

---

## 3. MongoDB Database Architecture (Phase 4)

The database design comprises **seven core collections** with Mongoose ObjectId references, timestamps, and indexes:

| Collection | Key Fields | Relationships | Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| **`users`** | `name`, `email`, `password`, `role`, `phone`, `accountStatus`, `barCouncilId` | None | Unique index on `email`, enum on `role` (`ADMIN`, `LAWYER`, `CLIENT`, `CLERK`) |
| **`clients`** | `name`, `email`, `phone`, `organization`, `address`, `status` | `assignedLawyer` → `User`, `userAccount` → `User` | Index on `email`, compound text index on `name` & `organization` |
| **`cases`** | `caseReference`, `title`, `caseType`, `courtName`, `status`, `stage`, `progress` | `client` → `Client`, `assignedLawyer` → `User` | **Unique index** on `caseReference` (`LCMS-YYYY-XXXX`), index on `status` & `filingDate` |
| **`hearings`** | `courtName`, `courtroom`, `judgeName`, `hearingDate`, `hearingTime`, `purpose`, `status` | `case` → `Case` | Index on `hearingDate` & `status`, enum on `status` |
| **`tasks`** | `title`, `description`, `priority`, `deadline`, `status` | `case` → `Case`, `assignedUser` → `User`, `createdBy` → `User` | Index on `deadline`, `assignedUser`, and `status` |
| **`documents`** | `title`, `documentType`, `filePath`, `fileSize`, `mimeType`, `isConfidential` | `case` → `Case`, `uploadedBy` → `User` | Index on `case` & `documentType` |
| **`notifications`** | `title`, `message`, `type`, `isRead`, `createdAt` | `recipient` → `User`, `relatedCase` → `Case` | Index on `recipient` & `isRead` |

---

## 4. Database Setup & Options

The backend supports **three flexible database options**:

### Option A: Local MongoDB via Docker (Recommended for DevOps)
If you have Docker installed and running:
```bash
# Start a local MongoDB container
docker run -d -p 27017:27017 --name legal-mongo mongo:7

# The backend will connect automatically to:
# mongodb://localhost:27017/legal_case_management_db
```

### Option B: Cloud MongoDB Atlas (Free Cluster)
1. Create a free cluster on [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user and whitelist your IP (`0.0.0.0/0` for development).
3. Update `MONGODB_URI` in `backend/.env`:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/legal_case_management_db?retryWrites=true&w=majority
   ```

### Option C: Automated Development Fallback (`mongodb-memory-server`)
If neither Docker nor Atlas is configured yet, the backend automatically launches a transient in-memory MongoDB instance during development. This ensures you can immediately run tests and demonstrate features without installation blockers.

---

## 5. Database Seeding & Verification Tests

### Run the Seeder Script
Populates demo legal dockets, court hearings, tasks, documents, and 4 role accounts:
```bash
cd backend
npm run seed
```

### Pre-Configured Demo Credentials (All Passwords Encrypted with bcrypt)
| Role | Email Address | Password | Name & Designation |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@jurismanagement.in` | `Admin@123` | Adv. Rajeshwar Sharma (Managing Partner) |
| **LAWYER** | `abhishek@jurismanagement.in` | `Lawyer@123` | Adv. Mamillapally Abhishek (Bar ID: TS/2026/51762) |
| **CLIENT** | `vikram.rao@enterprise.com` | `Client@123` | Vikramaditya Rao (Director, Zenith Tech Ltd) |
| **CLERK** | `suresh.clerk@jurismanagement.in` | `Clerk@123` | Suresh Chandra (Registry & Cause List Clerk) |

### Run the Automated Phase 4 Test Suite
```bash
cd backend
npm run test:db
```
Verifies:
- 100% successful database connection
- All 7 collections seeded and retrieved
- bcrypt cryptographic password protection
- Unique email rejection (`E11000`)
- Unique case reference rejection (`E11000`)
- Mongoose relational `.populate()` resolution

---

## 6. How to Run the Servers

### A. Running the React Frontend (Phase 2)
```bash
cd frontend
npm run dev -- --host --port 3000
```
Open **`http://localhost:3000/`** in your browser.

### B. Running the Express Backend (Phase 3 & 4)
```bash
cd backend
node src/server.js
# Or with auto-reload:
npm run dev
```
Backend runs on **`http://127.0.0.1:5000`**.

---

## 7. Health Check Verification

```bash
curl -s http://127.0.0.1:5000/api/health
```

Expected output:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "JurisFlow Backend Service Health Status",
  "data": {
    "status": "HEALTHY",
    "service": "Legal Case and Court Hearing Management Portal API",
    "version": "1.0.0",
    "environment": "development",
    "academicMetadata": {
      "student": "MAMILLAPALLY ABHISHEK",
      "rollNumber": "2303A51762",
      "academicYear": "2026-2027",
      "course": "DevOps & Full Stack (B.Tech IV-I)"
    },
    "database": {
      "status": "CONNECTED",
      "connected": true,
      "host": "127.0.0.1",
      "databaseName": "test"
    },
    "modelsLoaded": [
      "User",
      "Client",
      "Case",
      "Hearing",
      "Task",
      "Document",
      "Notification"
    ]
  }
}
```
