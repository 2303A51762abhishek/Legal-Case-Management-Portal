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

## 10. The Four Mandatory Reports & Export Engine Architecture (Phase 9)

JurisFlow implements four distinct institutional reports powered by real-time MongoDB aggregations, query filters, and data export pipelines:

1. **Report 1: Case Status Report (`GET /api/reports/case-status`)**:
   - Comprehensive litigation portfolio breakdown including all 13 core metrics: Case Reference, Title, Client, Assigned Counsel, Court Name, Courtroom, Case Type, Filing Date, Current Status, Stage, Priority, Progress %, Last Hearing Date, and Next Scheduled Hearing Date.
   - Summary aggregates: Total Cases, Active Cases, Under Review / Pending Cases, Closed / Decided Cases, High-Priority Cases, and Status Breakdown distribution.
   - Query filters: Status, Priority, Case Type, Court, Assigned Lawyer, Date Range, and keyword search.
2. **Report 2: Hearing Calendar Report (`GET /api/reports/hearing-calendar`)**:
   - Cause list schedule including Hearing Date, Hearing Time, Duration, Case Reference, Case Title, Litigant, Counsel, Court Complex, Courtroom, Presiding Judge, Purpose, Status, and Next Hearing Date.
   - Summary aggregates: Scheduled Cause, Completed Hearings, Adjourned Hearings, Cancelled Hearings, and Active Court Complexes.
   - Query filters: Hearing Date Range, Court Complex, Presiding Judge, Counsel, and Status.
3. **Report 3: Pending Tasks Report (`GET /api/reports/pending-tasks`)**:
   - Litigation action items including Title, Linked Case Reference, Assignee Name & Role, Created By, Priority, Deadline Date, Status, Overdue Flag, and Dynamic **Days Remaining** signed integer.
   - Summary aggregates: Total Outstanding Tasks, Pending, In-Progress, Overdue, and Urgent.
   - Filters: Assignee, Case, Priority, Deadline Range, Status, and Overdue-only quick toggle.
4. **Report 4: Client Case Summary Report (`GET /api/reports/client-summary`)**:
   - Client caseload profiles including Client Name, Organization, Contact Email, Phone, City, Assigned Counsel, Total Cases, Active Cases, Closed Cases, and nested Array of linked litigation dockets.
   - Summary aggregates: Total Registered Clients, Active Retainers, Total Client Dockets, and Corporate Accounts.
5. **Data Export Engine (CSV & Printable PDF)**:
   - **CSV Export**: Client-side RFC 4180 compliant CSV export engine formatting headers, cell values, and escaping for Microsoft Excel and Google Sheets.
   - **Printable PDF Export**: Print-optimized stylesheet (`@media print`) rendering institutional headers (Student Name, Roll Number, Subject, University Year), hiding UI chrome, and outputting clean, publication-grade tables formatted for A4 landscape/portrait.

### Run the Automated Phase 9 Reports Test Suite
```bash
cd backend
npm run test:reports
```
Verifies:
- All 13 mandatory columns in Case Status Report
- Summary statistics computation across all 4 reports
- Date range, status, priority, and court query filtering
- Dynamic days remaining and overdue identification in task reports
- Client metadata and embedded caseload dockets array
- Litigant client privacy scoping across all 4 reports (internal records suppressed)

---

## 11. Complete Integration & All Role Dashboard Architecture (Phase 10)

1. **Role-Specific Dashboard REST APIs (`dashboard.controller.js` & `dashboard.routes.js`)**:
   - `GET /api/dashboard/admin` (ADMIN only): Firm-wide governance metrics (Total Users, Lawyers, Clerks, Clients, Cases, Trials, Scrutiny, Decided, Upcoming Hearings, Overdue Tasks), Case Status Distribution chart array, Task Priority Breakdown, Recent Dockets, and Hearing Rosters.
   - `GET /api/dashboard/lawyer` (LAWYER only): Assigned Caseload, Active Trials, Scrutiny Matters, Upcoming Court Appearances, Pending/Overdue Tasks, and Stage Progress bars.
   - `GET /api/dashboard/client` (CLIENT only): Litigant-specific overview with active legal dockets, lead advocate contact details, upcoming hearings, client action items, and public non-confidential case documents with streaming download links.
   - `GET /api/dashboard/clerk` (CLERK only): Court registry metrics (Cases registered today, hearings scheduled today, daily cause roster with courtroom bench numbers, and pending procedural registry tasks).
2. **Data Consistency Audit & Partitioning**:
   - Reconciled caseload categorization so that categories are strictly mutually exclusive:
     $$\text{Active Trials} + \text{Pending Scrutiny} + \text{Closed Matters} = \text{Total Cases}$$
   - Unified task overdue logic: A task is overdue if and only if $\text{status} \neq \text{'COMPLETED'}$ and $\text{deadline} < \text{Date.now()}$.
   - Unified hearing schedule logic: Only hearings with status $\text{'SCHEDULED'}$ and future dates are counted as upcoming; cancelled and completed hearings are excluded from active cause lists.
3. **Frontend Integration Across Views**:
   - [`AdminDashboardView.jsx`](file:///Users/abhishekmamillapally/Desktop/Legal-Case-Management-Portal/frontend/src/components/dashboard/AdminDashboardView.jsx): Live MongoDB aggregates, status distribution grid, and recent filings table.
   - [`LawyerDashboardView.jsx`](file:///Users/abhishekmamillapally/Desktop/Legal-Case-Management-Portal/frontend/src/components/dashboard/LawyerDashboardView.jsx): Designated dockets, stage completion progress bars, cause dates, and urgent tasks.
   - [`ClientDashboardView.jsx`](file:///Users/abhishekmamillapally/Desktop/Legal-Case-Management-Portal/frontend/src/components/dashboard/ClientDashboardView.jsx): Assigned counsel card with direct contact info, stage milestone progress bars, and secure document downloads.
   - [`ClerkDashboardView.jsx`](file:///Users/abhishekmamillapally/Desktop/Legal-Case-Management-Portal/frontend/src/components/dashboard/ClerkDashboardView.jsx): Intake counts, daily cause list with bench numbers, and registry task queue.

### Run the Automated Phase 10 Integration Test Suite
```bash
cd backend
npm run test:phase10
```
Verifies:
- All 4 role dashboard endpoints (`/admin`, `/lawyer`, `/client`, `/clerk`)
- Strict RBAC boundary enforcement (HTTP 403 Forbidden on cross-role access)
- Data consistency equation ($\text{Active} + \text{Pending} + \text{Closed} \equiv \text{Total Cases}$)
- Live mutation reaction: registering a case immediately increments admin and clerk metrics
- Client confidentiality guard (zero leakage of internal tasks or privileged documents)

### G. Phase 11: Data Integrity, Demo Seeder & Browser E2E Tests
```bash
cd backend
# 1. Seed Comprehensive Demonstration Records (Idempotent & Safe)
npm run seed:demo

# 2. Run Phase 11 Data Integrity & Relational Verification Suite
npm run test:phase11

# 3. Run Browser End-to-End Test Suite & Screenshot Captures
npm run test:e2e
```
Verifies:
- Safe, repeatable generation of 19 demo users, 10 clients, 32 cases, 42 hearings, 52 tasks, 20 sample files, and 28 notifications.
- Zero orphaned records (every case, hearing, task, document, and notification references valid entities).
- Non-overlapping courtrooms and presiding judges in scheduled cause appearances.
- Litigant privacy isolation and confidential document shielding.
- 14 automated browser interactions driving headless Google Chrome via Puppeteer.
- Captures 10 high-resolution visual screenshots into `docs/phase11/screenshots/`.
- Mobile viewport responsive layout verification (375x812 iPhone format).

---

## 12. Demonstration User Accounts & Credentials

> [!WARNING]
> **DEVELOPMENT ONLY NOTICE:** The following demonstration credentials are provided strictly for local university project testing, viva evaluation, and classroom presentation. Never use these credentials in a production environment. All passwords are securely hashed using bcrypt (10 rounds).

| Role | Name & Title | Email Address | Development Password | Access Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **`ADMIN`** | Adv. Rajeshwar Sharma *(Managing Partner)* | `admin@jurismanagement.in` | `Admin@123` | Full access to users, cases, cause lists, reports, firm metrics |
| **`LAWYER`** | Adv. Mamillapally Abhishek *(Lead Counsel)* | `abhishek@jurismanagement.in` | `Lawyer@123` | Assigned cases, trial progress, hearings, legal briefs, tasks |
| **`LAWYER`** | Adv. Priya Sharma *(Senior Corporate Counsel)* | `priya.sharma@jurismanagement.in` | `Lawyer@123` | Assigned corporate dockets, environmental compliance cases |
| **`LAWYER`** | Adv. Vikas Verma *(Constitutional Counsel)* | `vikas.verma@jurismanagement.in` | `Lawyer@123` | High Court writ petitions, renewable energy appeals |
| **`LAWYER`** | Adv. Ananya Deshmukh *(Arbitration Specialist)* | `ananya.deshmukh@jurismanagement.in` | `Lawyer@123` | Commercial arbitrations, EPC highway concession disputes |
| **`LAWYER`** | Adv. Arjun Menon *(Banking Law Specialist)* | `arjun.menon@jurismanagement.in` | `Lawyer@123` | Debt recovery, SARFAESI proceedings, NCLT insolvency |
| **`CLIENT`** | Vikramaditya Rao *(MD, Zenith Technologies)* | `vikram.rao@enterprise.com` | `Client@123` | Litigant portal: Own cases only, public documents, trial updates |
| **`CLIENT`** | Dr. Meera Nair *(Director, Apollo Diagnostics)* | `meera.nair@apollohealthcare.in` | `Client@123` | Litigant portal: Healthcare regulatory dockets, hearings |
| **`CLIENT`** | Rajesh Patel *(VP, Gujarat Maritime)* | `rajesh.patel@gujaratmaritime.in` | `Client@123` | Litigant portal: Admiralty proceedings, port clearance suits |
| **`CLIENT`** | Sunita Reddy *(CEO, Deccan Software)* | `sunita.reddy@deccansoft.in` | `Client@123` | Litigant portal: Commercial lease disputes, escrow litigation |
| **`CLERK`** | Suresh Chandra *(Registry & Cause Clerk)* | `suresh.clerk@jurismanagement.in` | `Clerk@123` | Case registration, scheduling hearings, filing dockets |
| **`CLERK`** | Ramesh Patel *(Filing & Scrutiny Clerk)* | `ramesh.clerk@jurismanagement.in` | `Clerk@123` | Summons service verification, court stamps, scrutiny |
| **`CLERK`** | Geeta Sharma *(Records Superintendent)* | `geeta.clerk@jurismanagement.in` | `Clerk@123` | Certified copies, judicial archives, registry listings |

---

## 13. Browser Visual Screenshots (Phase 11)

All high-fidelity screenshots are captured automatically by `npm run test:e2e` using Google Chrome in headless mode and stored in `docs/phase11/screenshots/`:

| Screenshot File | Resolution | Description & Visual Modules Tested |
| :--- | :--- | :--- |
| **`01_login_page.png`** | 1440 × 900 | Clean authentication page with role autofill buttons and university metadata |
| **`02_admin_dashboard.png`** | 1440 × 900 | Administrative firm overview, 4 live metric stat cards, and recent dockets |
| **`03_lawyer_dashboard.png`** | 1440 × 900 | Advocate practice desk, assigned dockets, trial progress, and upcoming hearings |
| **`04_client_dashboard.png`** | 1440 × 900 | Litigant portal, client-scoped matters, trial progress, and public documents |
| **`05_clerk_dashboard.png`** | 1440 × 900 | Registry cause list, daily intake dockets, and pending clerical filing tasks |
| **`06_cases_management.png`** | 1440 × 900 | Complete legal dockets directory, status filters, search, and pagination |
| **`07_hearings_calendar.png`** | 1440 × 900 | Court hearing cause list, calendar schedule, courtroom allocations, and judges |
| **`08_tasks_board.png`** | 1440 × 900 | Task priority badges (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), overdue flags, and assignees |
| **`09_document_vault.png`** | 1440 × 900 | Secure case brief archive, file type badges, size indicators, and streaming download |
| **`10_reports_analytics.png`** | 1440 × 900 | Four mandatory reports engine with CSV download and printable PDF actions |

---

## 14. How to Run the Servers & Execute All Tests

### Step 1: Start the Backend REST API Server
```bash
cd backend
npm start
# Server listens on http://127.0.0.1:5000
```

### Step 2: Start the React Frontend Development Server
```bash
cd frontend
npm run dev -- --host --port 3000
# Accessible at http://localhost:3000/
```

### Step 3: Seed Demonstration Data
```bash
cd backend
npm run seed:demo
```

### Step 4: Run the Complete Automated Test Suite (Phases 5 to 11)
```bash
cd backend
npm run test:auth      # Phase 5: Authentication & RBAC
npm run test:cases     # Phase 6: Cases & Clients
npm run test:hearings  # Phase 7: Hearing Schedule & Conflict Prevention
npm run test:phase8    # Phase 8: Tasks, Documents Vault & Notifications
npm run test:reports   # Phase 9: Four Mandatory Reports & CSV/PDF Export
npm run test:phase10   # Phase 10: All Role Dashboards & Live Integration
npm run test:phase11   # Phase 11: Relational Data Integrity & Benchmarks
npm run test:e2e       # Phase 11: Puppeteer Browser Workflows & Screenshots
```

---

## 15. Health Check Verification

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

---

## 16. Docker & Docker Compose Containerization (Phase 12)

JurisFlow is fully containerized using Docker and orchestrated with Docker Compose for production-grade, multi-container deployment.

### 16.1 Architecture Overview

```mermaid
flowchart TD
    subgraph Host ["Host Machine (macOS / Linux / Windows)"]
        Browser["Web Browser (http://localhost:3000)"]
    end

    subgraph DockerBridge ["Docker Bridge Network (jurisflow-network)"]
        subgraph FrontendContainer ["Frontend Container (jurisflow-frontend)"]
            Nginx["Nginx Reverse Proxy & Static Server (Port 80)"]
            StaticAssets["Compiled React SPA (Vite / HTML / JS / CSS)"]
        end

        subgraph BackendContainer ["Backend Container (jurisflow-backend)"]
            Express["Node.js + Express.js API (Port 5000)"]
            Healthcheck["Internal Healthcheck (/api/health)"]
            NonRootUser["Runs as Non-Root User: node (UID 1000)"]
        end

        subgraph DBContainer ["Database Container (jurisflow-mongodb)"]
            MongoDaemon["MongoDB 7.0 Engine (Port 27017)"]
            AuthEngine["SCRAM-SHA-256 Authentication"]
        end
    end

    subgraph NamedVolumes ["Persistent Docker Volumes"]
        VolDB[("mongodb_data -> /data/db")]
        VolDocs[("document_vault -> /usr/src/app/src/uploads")]
    end

    Browser -->|Port 3000| Nginx
    Nginx -->|Serve SPA Routes| StaticAssets
    Nginx -->|Proxy /api/* to http://backend:5000/api/| Express
    Express -->|Authenticate & Query| MongoDaemon
    MongoDaemon --- VolDB
    Express --- VolDocs
```

### 16.2 Services & Ports

| Service | Container Name | Base Image | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`frontend`** | `jurisflow-frontend` | `nginx:alpine` (multi-stage) | 80 | `3000` | Nginx web server, SPA routing, reverse proxy `/api/` |
| **`backend`** | `jurisflow-backend` | `node:20-alpine` | 5000 | `5001` (avoids macOS AirPlay 5000 collision) | Express.js REST API with Mongoose and Multer |
| **`mongodb`** | `jurisflow-mongodb` | `mongo:7.0` | 27017 | `127.0.0.1:27017` (strictly loopback, no 0.0.0.0) | Persistent MongoDB database with root credentials |

### 16.3 Production Dockerfiles

- **Backend Dockerfile (`backend/Dockerfile`)**:
  - Base: lightweight, official `node:20-alpine`.
  - Installs production dependencies only via `npm ci --omit=dev`.
  - Runs under the non-privileged `node` user for defense-in-depth container security.
  - Features an integrated `HEALTHCHECK` checking `http://127.0.0.1:5000/api/health`.
  - Excludes development secrets and test artifacts via `backend/.dockerignore`.

- **Frontend Dockerfile (`frontend/Dockerfile`)**:
  - Multi-stage build pattern:
    - **Stage 1 (Builder)**: `node:20-alpine` installs dependencies and compiles the Vite SPA with `ARG VITE_API_URL=/api`.
    - **Stage 2 (Runtime)**: Minimal `nginx:alpine` image serving static assets with custom `nginx.conf`.
  - Features SPA fallback routing (`try_files $uri $uri/ /index.html`).
  - Configures reverse proxy passing `/api/` to `http://backend:5000/api/` with streaming timeouts and a 15 MB client upload ceiling (`client_max_body_size 15M`).
  - Provides lightweight container health check on `GET /healthz`.

### 16.4 Persistent Data Volumes

The Docker Compose configuration defines two named volumes to guarantee zero data loss across container lifecycle events:
- **`mongodb_data`**: Bound to `/data/db` inside MongoDB. Preserves all legal dockets, users, hearings, and relational schemas.
- **`document_vault`**: Bound to `/usr/src/app/src/uploads` inside the backend container. Preserves uploaded case petitions and legal briefs across container restarts and rebuilds.

### 16.5 Docker Compose Management Commands

```bash
# 1. Build and start all three containers in background mode
docker compose up --build -d

# 2. Check operational status and healthcheck states
docker compose ps

# 3. View live unified logs across all services
docker compose logs -f

# 4. View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# 5. Restart backend service (demonstrates volume persistence)
docker compose restart backend

# 6. Stop all containers without losing persistent database or documents
docker compose down

# CAUTION: Never pass -v unless you intentionally wish to delete all test data:
# docker compose down -v  <-- Destroys named volumes
```

### 16.6 Testing and Verifying the Container Stack

```bash
# 1. Verify Frontend Nginx Healthcheck
curl http://localhost:3000/healthz

# 2. Verify Backend Health via Direct Host Port (5001)
curl http://localhost:5001/api/health

# 3. Verify Backend Health via Nginx Reverse Proxy (3000)
curl http://localhost:3000/api/health

# 4. Run the Automated Docker Verification Suite
cd backend
npm run test:docker

# 5. Run the Phase 11 Test Suite against the Container Stack
npm run test:phase11

# 6. Run the End-to-End Browser Test Suite against the Container Stack
npm run test:e2e
```

---

## 17. Kubernetes Manifests & Orchestration (Phase 13)

JurisFlow includes a complete, production-grade Kubernetes manifest suite located in the [`kubernetes/`](kubernetes/) directory for multi-tier cluster orchestration.

### 17.1 Kubernetes Resource Architecture

```mermaid
flowchart TD
    subgraph IngressGateway ["Cluster Ingress / Gateway"]
        Ingress["jurisflow-ingress (Nginx Ingress / Port-Forward 3000)"]
    end

    subgraph K8sNamespace ["Namespace: jurisflow"]
        subgraph FrontTier ["Frontend Tier (Stateless Replicas: 2)"]
            FrontSvc["Service: frontend (ClusterIP: 80)"]
            FrontDeploy["Deployment: frontend (Nginx + React SPA)"]
        end

        subgraph BackTier ["Backend Tier (Single-Writer: 1)"]
            BackSvc["Service: backend (ClusterIP: 5000)"]
            BackDeploy["Deployment: backend (Node.js 20 LTS API)"]
            VaultMount["Mount: /usr/src/app/src/uploads"]
        end

        subgraph MongoTier ["Database Tier (StatefulSet: 1)"]
            MongoSvc["Service: mongodb (ClusterIP: 27017)"]
            MongoSS["StatefulSet: mongodb (mongo:7.0)"]
            DBMount["Mount: /data/db"]
        end

        subgraph SecretsConfig ["Configuration"]
            ConfigMap["ConfigMap: jurisflow-config"]
            Secret["Secret: jurisflow-secrets"]
        end
    end

    subgraph PVCTier ["Persistent Volume Claims"]
        VaultPVC[("jurisflow-vault-pvc (2Gi)")]
        MongoPVC[("mongodb-data-mongodb-0 (5Gi)")]
    end

    Ingress -->|Route / and /api| FrontSvc
    FrontSvc --> FrontDeploy
    FrontDeploy -->|http://backend:5000/api/| BackSvc
    BackSvc --> BackDeploy
    BackDeploy -->|mongodb.jurisflow.svc.cluster.local:27017| MongoSvc
    MongoSvc --> MongoSS

    BackDeploy --- VaultMount
    VaultMount --- VaultPVC
    MongoSS --- DBMount
    DBMount --- MongoPVC

    ConfigMap -.-> BackDeploy & MongoSS
    Secret -.-> BackDeploy & MongoSS
```

### 17.2 Manifest Inventory

| File Path | Kind | Name | Namespace | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`kubernetes/namespace.yaml`** | `Namespace` | `jurisflow` | N/A | Dedicated isolated namespace with student metadata labels |
| **`kubernetes/configmap.yaml`** | `ConfigMap` | `jurisflow-config` | `jurisflow` | Non-sensitive configs (`NODE_ENV`, `PORT`, `MONGODB_DATABASE`, limits) |
| **`kubernetes/secret.example.yaml`** | `Secret` | `jurisflow-secrets` | `jurisflow` | Safe secret template with placeholders (anti-leak guarded) |
| **`kubernetes/mongodb/pvc.yaml`** | `PersistentVolumeClaim` | `mongodb-data-mongodb-0`| `jurisflow` | 5Gi persistent volume claim for MongoDB data (`/data/db`) |
| **`kubernetes/mongodb/service.yaml`** | `Service` | `mongodb` | `jurisflow` | Internal `ClusterIP` on port 27017 (no public exposure) |
| **`kubernetes/mongodb/statefulset.yaml`**| `StatefulSet` | `mongodb` | `jurisflow` | MongoDB 7.0 StatefulSet with `volumeClaimTemplates` & probes |
| **`kubernetes/backend/pvc.yaml`** | `PersistentVolumeClaim` | `jurisflow-vault-pvc` | `jurisflow` | 2Gi persistent volume claim for Document Vault uploads |
| **`kubernetes/backend/service.yaml`** | `Service` | `backend` | `jurisflow` | Internal `ClusterIP` on port 5000 (`backend.jurisflow.svc.cluster.local`) |
| **`kubernetes/backend/deployment.yaml`** | `Deployment` | `backend` | `jurisflow` | Express REST API, non-root user `node` (UID 1000), 3 probes |
| **`kubernetes/frontend/service.yaml`** | `Service` | `frontend` | `jurisflow` | `ClusterIP` on port 80 routing web traffic to frontend pods |
| **`kubernetes/frontend/deployment.yaml`**| `Deployment` | `frontend` | `jurisflow` | 2 stateless replicas, Nginx reverse proxy, `/healthz` probes |
| **`kubernetes/ingress.yaml`** | `Ingress` | `jurisflow-ingress` | `jurisflow` | Nginx Ingress routing `jurisflow.local` with 15MB upload limit |

### 17.3 Deployment Commands (Quickstart)

```bash
# 1. Create the dedicated namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Apply non-sensitive configuration
kubectl apply -f kubernetes/configmap.yaml

# 3. Create the Kubernetes Secret (imperative, never committed to git)
kubectl create secret generic jurisflow-secrets \
  --namespace=jurisflow \
  --from-literal=mongo-root-username=admin \
  --from-literal=mongo-root-password=LegalCaseSecure2026 \
  --from-literal=jwt-secret=jurisflow_jwt_production_secret_key_2026_devops \
  --from-literal=mongodb-uri="mongodb://admin:LegalCaseSecure2026@mongodb.jurisflow.svc.cluster.local:27017/legal_case_management_db?authSource=admin"

# 4. Deploy MongoDB StatefulSet & Service
kubectl apply -f kubernetes/mongodb/
kubectl rollout status statefulset/mongodb -n jurisflow --timeout=120s

# 5. Deploy Backend Deployment & Service
kubectl apply -f kubernetes/backend/
kubectl rollout status deployment/backend -n jurisflow --timeout=120s

# 6. Deploy Frontend Deployment & Service
kubectl apply -f kubernetes/frontend/
kubectl rollout status deployment/frontend -n jurisflow --timeout=60s

# 7. (Optional) Apply Ingress routing
kubectl apply -f kubernetes/ingress.yaml
```

### 17.4 Accessing the Application in Kubernetes

```bash
# Forward frontend service to local port 3000:
kubectl port-forward svc/frontend 3000:80 -n jurisflow

# Open in browser:
# http://localhost:3000/
```

### 17.5 Running the Automated Kubernetes Verification Suite

```bash
cd backend
npm run test:kubernetes
```

