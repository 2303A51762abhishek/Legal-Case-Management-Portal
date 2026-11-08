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

## 6. Authentication & Security Architecture (Phase 5)

The authentication system implements industry-grade web security:

1. **Cryptographic Password Hashing**: Passwords hashed with `bcryptjs` using 10 salt rounds. Plaintext passwords are never stored or logged.
2. **Dual-Channel JWT Delivery**: Signed tokens are delivered both in the JSON payload (for Axios request headers) and via **HttpOnly cookies** (`SameSite: 'lax'`, `maxAge: 24h`) to prevent XSS credential theft.
3. **Anti-Privilege Escalation**: The public registration endpoint (`/api/auth/register`) strictly forces the `CLIENT` role. Attempting to inject `ADMIN`, `LAWYER`, or `CLERK` in public payloads is actively disregarded.
4. **Administrative User Provisioning**: Only authenticated `ADMIN` users can access `POST /api/users` to create advocates, registry clerks, and firm administrators.
5. **Brute Force Rate Limiting**: The `/api/auth/*` endpoints are protected by an express rate limiter allowing at most 30 attempts per 15 minutes per IP address.
6. **Session Restoration**: On page reload or browser restart, the React application automatically calls `GET /api/auth/me` to rehydrate user profiles without re-entering credentials.

### Run the Automated Phase 5 Authentication & RBAC Test Suite
```bash
cd backend
npm run test:auth
```
Verifies:
- Login authentication across all 4 roles (`ADMIN`, `LAWYER`, `CLIENT`, `CLERK`)
- 401 rejection on invalid passwords or non-existent accounts
- Anti-privilege escalation guard enforcement
- 409 rejection on duplicate registration attempts
- Session recovery via `/api/auth/me`
- Tampered JWT token rejection
- Strict 403 Forbidden blocking on unauthorized role access (`/api/users`)
- Administrative privileged user creation

---

## 7. Client & Case Management Architecture (Phase 6)

1. **Automatic Case Reference Number Generation**:
   Generates unique court references formatted as `LCMS-YYYY-XXXX` (e.g. `LCMS-2026-0105`) with a thread-safe increment loop preventing collisions.
2. **Client Management System**:
   - `POST /api/clients`: Client registration with address, organization, and advocate assignment.
   - `GET /api/clients`: Client directory with live case counts, search, and pagination.
   - `GET /api/clients/:id`: Single client details with role-scoped authorization.
   - `PUT /api/clients/:id`: Update client metadata.
   - `GET /api/clients/:id/cases`: Full litigation case history for a client.
3. **Case Management System**:
   - `POST /api/cases`: Registers dockets, validates lawyer & client ObjectIds, assigns stage & progress.
   - `GET /api/cases`: Scoped retrieval (Admin/Clerk: All, Lawyer: Assigned only, Client: Own only).
   - `GET /api/cases/:id`: Detailed case view with populated client and lawyer.
   - `PUT /api/cases/:id`: Updates progress, stage, priority, and status. Litigant clients are forbidden from modifying records.

### Run the Automated Phase 6 Client & Case Test Suite
```bash
cd backend
npm run test:cases
```
Verifies:
- Client creation, duplicate email rejection (409), and search
- Case registration with `LCMS-YYYY-XXXX` reference validation
- Role-based scoping across ADMIN, LAWYER, CLIENT, and CLERK
- Litigant client cross-case isolation (403 Forbidden on other clients' dockets)
- Modification protection (CLIENT cannot edit cases)
- Lawyer stage progress updates (`PUT /api/cases/:id`)
- Status filtering and pagination

---

## 8. Court Hearing Calendar & Conflict Prevention Architecture (Phase 7)

1. **Intelligent Scheduling & Conflict Prevention Engine (`conflict.service.js`)**:
   - Compares candidate start and end time windows against active court hearings.
   - **Courtroom Conflict Detection**: Prohibits concurrent hearings in the same courtroom within the same court complex (`HTTP 409 Conflict`).
   - **Judge Overlap Conflict Detection**: Prohibits a presiding judge from being double-booked across different courtrooms at identical or overlapping time slots (`HTTP 409 Conflict`).
   - **Cancelled Hearing Exemption**: Automatically bypasses hearings with `CANCELLED` status so freed slots can be immediately rescheduled.
2. **Automated Notification Service (`notification.service.js`)**:
   - Automatically dispatches in-app notifications to assigned advocates and litigants whenever a hearing is scheduled, adjourned, or rescheduled.
3. **Court Hearing REST APIs**:
   - `POST /api/hearings`: Schedules hearing with conflict checks, sets case stage/status, and notifies parties.
   - `GET /api/hearings`: Role-scoped hearing retrieval with search and query filters (`caseReference`, `status`, `courtName`, `hearingDate`, `lawyer`).
   - `GET /api/hearings/:id`: Fetches detailed hearing entry with populated case, client, and lawyer references.
   - `PUT /api/hearings/:id`: Reschedules hearing, updates court/judge/notes with overlap validation.
   - `PATCH /api/hearings/:id/status`: Quickly updates hearing lifecycle status (`SCHEDULED`, `ADJOURNED`, `COMPLETED`, `CANCELLED`).
   - `DELETE /api/hearings/:id`: Soft-cancellation (marks as `CANCELLED` rather than destroying historical audit records).
4. **Interactive Frontend Calendar & Cause List (`HearingsPage.jsx`)**:
   - **Dual Views**: Interactive 7x5 monthly calendar view with color-coded hearing badges and a high-density tabular Cause List view.
   - **Scheduling Modal**: Cause scheduling drawer with real-time feedback, courtroom, judge, and duration configuration.
   - **Real-Time Conflict Warning**: Surfaces server-detected courtroom/judge overlap errors with actionable conflict badges.
   - **Direct Lifecycle Actions**: One-click adjournment, completion marking, and cancellation modals.

### Run the Automated Phase 7 Court Hearing Test Suite
```bash
cd backend
npm run test:hearings
```
Verifies:
- Hearing registration with start/end duration calculation
- Courtroom overlap conflict rejection (409 Conflict)
- Presiding judge double-booking rejection (409 Conflict)
- Cancelled hearing exclusion from conflict checks
- Role-based scoping (Admin/Lawyer/Client/Clerk)
- Litigant client scheduling prohibition (403 Forbidden)
- Advocate status patching (`PATCH /api/hearings/:id/status`)

---

## 9. Tasks, Deadlines, Document Vault & Notification Architecture (Phase 8)

1. **Task & Deadline Management System (`task.controller.js`)**:
   - `POST /api/tasks`: Create legal action task with priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), deadline, case linkage, and assignee notification.
   - `GET /api/tasks`: Role-scoped task board with search, dynamic overdue calculation, and aggregate statistics (`total`, `pending`, `inProgress`, `completed`, `overdue`, `urgent`).
   - `GET /api/tasks/:id`: Task profile with populated case, assignee, and creator.
   - `PUT /api/tasks/:id`: Edit task details (Admin, Lawyer, Clerk).
   - `PATCH /api/tasks/:id/status`: Fast lifecycle transition (`PENDING` -> `IN_PROGRESS` -> `COMPLETED`), auto-recording `completedAt`.
   - `DELETE /api/tasks/:id`: Soft-deletion (`isDeleted: true`).
   - **Litigant Privilege Guard**: Litigant clients can only see tasks designated with `isClientVisible: true` for their cases; confidential internal advocate drafting, research, and filing instructions remain hidden.
2. **Multer Secure Document Vault (`upload.middleware.js` & `document.controller.js`)**:
   - `POST /api/documents/upload`: Multipart document upload supporting PDF, DOC, DOCX, JPG, and PNG up to 10 MB.
   - **Deep Magic-Byte Header Inspection**: Inspects the physical byte signature of uploaded files (`%PDF`, `PK\x03\x04`, `0xFF\xD8\xFF`, etc.) to prevent disguised malicious binaries or scripts.
   - **Secure Storage Names**: Generates non-guessable, sanitized storage filenames (`doc_<timestamp>_<hex>.<ext>`). Private host filesystem paths are never exposed in API responses.
   - `GET /api/documents`: Document directory with case and type filters. Litigant clients are strictly barred from viewing confidential documents (`isConfidential: true`).
   - `GET /api/documents/:id/download`: Secure file streaming download with path traversal prevention (`path.resolve` containment guard) and role authorization checks.
   - `DELETE /api/documents/:id`: Soft-deletion for authorized counsel and administrators.
3. **Notification Center & Automated Reminder Engine (`reminder.service.js`)**:
   - `GET /api/notifications`: User-scoped notification list with real-time unread counts and type filtering.
   - `PATCH /api/notifications/:id/read`: Mark individual notification as read.
   - `PATCH /api/notifications/read-all`: Mark all notifications as read.
   - **Automated Scheduled Reminder Mechanism**:
     - Scans for upcoming court hearings within 48 hours and approaching task deadlines within 24 hours.
     - Automatically flags past-deadline tasks as `OVERDUE`.
     - Uses **cryptographic deduplication fingerprints** (`fingerprint: REMINDER_HEARING_<id>_<date>`) to guarantee litigants and advocates are never spammed with duplicate reminders.
     - Runs on server startup and every 5 minutes via a non-blocking background scheduler.
4. **Frontend Interfaces (`TasksPage.jsx`, `DocumentsPage.jsx`, `NotificationsPage.jsx`, `Navbar.jsx`)**:
   - Interactive Task Board with 6 metrics cards, status tabs, priority filters, and quick status toggling.
   - Drag-and-drop Document Vault with file preview, size formatting, type badges, and authenticated streaming downloads.
   - Live Notification Center with unread counter badge in Navbar and direct one-click read actions.

### Run the Automated Phase 8 Test Suite
```bash
cd backend
npm run test:phase8
```
Verifies:
- Task creation and real-time assignee notification
- Status transitions and `completedAt` timestamp tracking
- Automatic overdue task identification and stats calculation
- Client privilege scoping (internal tasks hidden, client tasks visible, 403 on client creation)
- Valid PDF Multer upload and physical path suppression
- Disguised file magic-byte rejection (HTTP 400 Bad Request)
- Secure document streaming download & path traversal prevention
- Confidential document privilege guard (HTTP 403 Forbidden on client download)
- Notification retrieval, single read patch, bulk read patch, and reminder deduplication

---

## 10. How to Run the Servers

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

## 11. Health Check Verification

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
      "databaseName": "legal_case_management_db"
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
