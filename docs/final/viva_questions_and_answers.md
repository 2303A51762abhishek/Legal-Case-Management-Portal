# JurisFlow Viva Voce Comprehensive Question & Answer Bank

**Project:** Legal Case and Court Hearing Management Portal (JurisFlow)  
**Student:** MAMILLAPALLY ABHISHEK  
**Roll Number:** 2303A51762  
**Course:** DevOps & Full Stack (B.Tech IV Year I Semester)  
**Academic Year:** 2026–2027  
**Total Questions:** 120 Comprehensive Questions with Accurate, Concise Answers

---

## Part 1: Project Overview & System Architecture

### Q1. What is JurisFlow and what real-world problem does it solve?
**Answer:** JurisFlow is an enterprise legal practice and court hearing management portal designed for law firms, legal counsels, litigants, and court clerks. It solves the critical issues of manual legal diary maintenance, missed court appearance dates, courtroom/judge scheduling conflicts, document misplacement, and poor client communication by offering unified role-based dashboards, automated cause lists, a secure document vault, and real-time deadline notifications.

### Q2. What is the core technology stack used in JurisFlow?
**Answer:**
- **Frontend:** React.js (Vite), Tailwind CSS, Lucide React icons, Axios HTTP client with JWT interceptors.
- **Backend:** Node.js, Express.js REST API with modular MVC architecture.
- **Database:** MongoDB Community 7.0 with Mongoose ODM (7 collections with strict indexes and references).
- **Security:** JSON Web Tokens (JWT), bcryptjs password hashing (salt rounds = 10), Helmet HTTP headers, CORS, brute-force rate limiter.
- **DevOps & Cloud:** Git/GitHub, Docker, Docker Compose multi-container orchestration, and Kubernetes manifests (StatefulSet, Deployments, Services, ConfigMaps, Secrets, Ingress, PVCs).

### Q3. What user roles exist in JurisFlow and how do their capabilities differ?
**Answer:** JurisFlow supports four strictly isolated roles:
1. **ADMIN (Managing Partner):** Firm-wide governance, user CRUD, system health metrics, all cases, all hearings, all tasks, and executive analytical reports.
2. **LAWYER (Advocate):** Practice desk, assigned dockets only, case progress updates, court appearance calendar, client brief access, task execution.
3. **CLIENT (Litigant):** Read-only visibility into own cases, upcoming hearing dates, authorized non-confidential orders/petitions, and action item tasks.
4. **CLERK (Court Registry Officer):** Daily cause list rosters, new docket intake (`LCMS-YYYY-XXXX`), clerical filing tasks, hearing scheduling.

### Q4. Why did you choose MongoDB instead of a relational database like MySQL or PostgreSQL?
**Answer:** Legal cases often involve dynamic metadata that evolves throughout a trial (variable courtroom numbers, adjournment reasons, multiple filing stages, nested document metadata, and notification logs). MongoDB's flexible BSON document model, combined with Mongoose's schema enforcement, allows rapid iteration while supporting complex relational references via `ObjectId` and Mongoose `.populate()`. Additionally, MongoDB 7.0 easily scales in containers and supports horizontal sharding.

### Q5. What is the difference between monolithic and three-tier architecture in JurisFlow?
**Answer:** JurisFlow utilizes a decoupled three-tier architecture:
- **Presentation Tier:** Independent React SPA served via Nginx.
- **Logic Tier:** Stateless Express.js REST API communicating over HTTP/JSON.
- **Data Tier:** MongoDB database and persistent Docker/Kubernetes volumes.  
This separation enables independent scaling (e.g. scaling frontend to 4 replicas while keeping backend single-writer for storage safety) and modular upgrades.

### Q6. How does JurisFlow prevent courtroom and judge scheduling conflicts?
**Answer:** Through an intelligent conflict prevention service (`conflict.service.js`). When scheduling or rescheduling a hearing, the backend executes an atomic query checking whether the specified courtroom or judge already has an overlapping active hearing on that date and time (taking `durationMinutes` into account). If a conflict exists, it aborts the operation and returns HTTP 409 Conflict with descriptive collision metadata.

---

## Part 2: Frontend Architecture & React.js

### Q7. Why did you use Vite instead of Create React App (CRA)?
**Answer:** CRA is deprecated and relies on slow Webpack bundling. Vite uses native browser ES Modules (ESM) during development and the highly optimized Rollup bundler for production builds. Vite provides instantaneous server start (under 250 ms in our project) and lightning-fast Hot Module Replacement (HMR).

### Q8. What is a Single Page Application (SPA) and how does client-side routing work?
**Answer:** An SPA loads a single HTML file (`index.html`) on the initial request. As the user navigates between pages (`/cases`, `/hearings`, `/reports`), React Router intercepts browser navigation events and dynamically re-renders components in the DOM without triggering a full page reload.

### Q9. Why is Nginx configured with `try_files $uri $uri/ /index.html;` in production?
**Answer:** In an SPA, routes like `/cases` exist only in React Router's memory, not as actual physical files on the web server disk. Without `try_files`, directly navigating to or refreshing `http://localhost:3000/cases` would result in an Nginx HTTP 404 Not Found error. `try_files` instructs Nginx to fall back to `index.html`, allowing React Router to handle the route client-side.

### Q10. How is global authentication state managed in the React frontend?
**Answer:** Using React's Context API (`AuthContext.jsx`). The `AuthProvider` component wraps the application tree, holding the current `user` object and `token`. It initializes state by rehydrating credentials from browser `localStorage` and exposes login, logout, and role-switching utilities to all consumer components via the custom hook `useAuth()`.

### Q11. What is an Axios Interceptor and how is it used in JurisFlow?
**Answer:** Axios interceptors are middleware functions that intercept HTTP requests or responses before they are handled by `then` or `catch`.
- **Request Interceptor:** Automatically extracts the JWT token from `localStorage` and attaches the `Authorization: Bearer <token>` header to all outgoing requests.
- **Response Interceptor:** Detects global HTTP 401 Unauthorized errors (e.g. expired session) and automatically redirects the user to `/login`.

### Q12. What is the role of Tailwind CSS in your frontend design?
**Answer:** Tailwind CSS is a utility-first CSS framework. It eliminates the need for separate CSS stylesheet maintenance, reduces bundle size via PostCSS purging, and allows consistent, responsive styling using pre-configured color palettes (Navy Blue `#0F172A`, Slate, Emerald, Crimson) and responsive breakpoint prefixes (`sm:`, `md:`, `lg:`).

### Q13. How are role-based protected routes implemented in React?
**Answer:** Using a dedicated `ProtectedRoute.jsx` component. It checks if the user is authenticated; if not, it redirects them to `/login`. If authenticated, it verifies whether the user's role is included in the allowed `roles` array prop. If unauthorized, it redirects to their permitted dashboard, preventing unauthorized URL access.

### Q14. What are React Hooks and which ones did you use?
**Answer:** Hooks are functions that allow functional components to manage state and lifecycle features:
- `useState`: Manages local component state (form inputs, modal visibility, filter selections).
- `useEffect`: Triggers side effects (fetching API data on component mount, setting intervals).
- `useContext`: Consumes global context (`useAuth`).
- `useNavigate`: Programmatically navigates between routes.
- `useMemo` / `useCallback`: Optimizes calculation performance on large datasets.

### Q15. How does the frontend handle loading and error states during API calls?
**Answer:** Each page component tracks `loading` (boolean) and `error` (string) state variables. Before triggering Axios requests, `loading` is set to `true`. When the promise resolves, data is populated and `loading` is set to `false`. If the request fails, the catch block captures the API error message and renders a styled alert banner.

### Q16. How does the live Role Switcher on the navbar work during demonstration?
**Answer:** In development/demo mode, the navbar features quick-switch buttons for Admin, Lawyer, Client, and Clerk. Clicking a button triggers a programmatic login request using pre-seeded test credentials, retrieves a valid JWT token, updates `AuthContext`, and immediately redirects to that role's designated dashboard view.

---

## Part 3: Backend Architecture & Express.js

### Q17. What is Express.js middleware and what is the execution order in JurisFlow?
**Answer:** Middleware functions are functions that have access to the request object (`req`), response object (`res`), and the `next` middleware function. The execution order in `app.js` is:
1. `helmet()` — security HTTP headers.
2. `cors()` — cross-origin policy validation.
3. `morgan()` — HTTP request logger.
4. `express.json({ limit: '10mb' })` — JSON body parser.
5. `cookieParser()` — cookie parsing.
6. `rateLimit()` — brute-force protection.
7. Modular API routes (`/api/auth`, `/api/cases`, etc.).
8. `notFoundHandler` — 404 catch-all.
9. `errorHandler` — centralized error response standardizer.

### Q18. How is centralized error handling implemented in Express?
**Answer:** Express recognizes error-handling middleware by its four-argument signature: `(err, req, res, next)`. Our centralized error middleware (`error.middleware.js`) catches unhandled promise rejections, Mongoose validation errors, duplicate key errors (code 11000), and JWT expiration errors, formatting them into a standardized JSON response: `{ success: false, statusCode, message, errors }`.

### Q19. What is Helmet and why is it essential for production security?
**Answer:** `helmet` is a security middleware that sets secure HTTP response headers, including:
- `X-DNS-Prefetch-Control`
- `X-Frame-Options` (prevents clickjacking attacks)
- `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing)
- `Strict-Transport-Security` (forces HTTPS)
- `Content-Security-Policy`

### Q20. What is CORS and how is it configured in your backend?
**Answer:** Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts web pages from making requests to a different domain/port than the one that served the page. We configured CORS with `credentials: true` and an explicit whitelist including `http://localhost:3000`, `http://127.0.0.1:3000`, container hosts, and the Ingress hostname `http://jurisflow.local`.

### Q21. Why did you separate `app.js` and `server.js`?
**Answer:** Separation of concerns:
- `app.js` configures the Express application, routes, and middleware without starting the HTTP listener. This allows integration test suites to test routes without occupying a physical network port.
- `server.js` is the operational entrypoint that connects to MongoDB, starts the cron scheduler, and calls `app.listen(PORT)`.

### Q22. How does the backend handle graceful shutdown?
**Answer:** `server.js` listens for OS signals `SIGTERM` and `SIGINT`. Upon receipt, it stops the recurring reminder cron, stops accepting new incoming HTTP connections via `server.close()`, closes the Mongoose database connection via `mongoose.connection.close()`, and exits cleanly with code 0.

### Q23. What is the purpose of the `/api/health` endpoint?
**Answer:** It serves as the primary health probe for Docker and Kubernetes. It returns HTTP 200 OK along with service uptime, academic metadata, database connection status (`CONNECTED` or `DISCONNECTED`), database host name, and an array of loaded Mongoose models.

### Q24. How do you prevent brute-force attacks on the authentication endpoints?
**Answer:** Using `express-rate-limit`. In `auth.routes.js`, a rate limiter restricts clients to 15 login requests per 15-minute window per IP address. Exceeding requests receive HTTP 429 Too Many Requests.

### Q25. What is the standardized API response structure used in JurisFlow?
**Answer:** All API endpoints return a uniform envelope created via `src/utils/response.js`:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation description",
  "data": { ... },
  "timestamp": "2026-11-08T..."
}
```

### Q26. How does the backend validate client request payloads?
**Answer:** Using `express-validator` middleware. Endpoints validate mandatory fields, email formatting, string length, and MongoDB `ObjectId` validity before passing control to business logic controllers.

---

## Part 4: Database Design, MongoDB & Mongoose

### Q27. What is Mongoose and what benefits does it provide over the native MongoDB driver?
**Answer:** Mongoose is an Object Data Modeling (ODM) library for MongoDB. It provides schema-level validation, type casting, default values, pre/post middleware hooks (e.g. hashing passwords before saving), query helpers, and model population (`.populate()`).

### Q28. Explain the seven core collections in JurisFlow and their relationships.
**Answer:**
1. **`users`:** Stores system credentials, roles, and status.
2. **`clients`:** Stores litigant contact info, organization, and references `assignedLawyer` (User).
3. **`cases`:** Core docket record referencing `client` and `assignedLawyer`.
4. **`hearings`:** Court appearances referencing linked `case`.
5. **`tasks`:** Action items referencing linked `case`, `assignedUser`, and `createdBy`.
6. **`documents`:** File metadata referencing `case` and `uploadedBy`.
7. **`notifications`:** Real-time alerts referencing `recipient` (User) and `relatedCase`.

### Q29. What indexes are created in your MongoDB schemas and why?
**Answer:**
- **Unique Indexes:** `users.email` (prevents duplicate accounts), `cases.caseReference` (guarantees docket uniqueness: `LCMS-YYYY-XXXX`), `notifications.deduplicationKey` (prevents duplicate notification spam).
- **Single-Field Indexes:** `cases.status`, `cases.filingDate`, `hearings.hearingDate`, `tasks.deadline`, `notifications.isRead`.
- **Compound Indexes:** `clients.name` + `clients.organization` for rapid text search; `hearings.courtName` + `hearings.courtroom` + `hearings.hearingDate` for rapid conflict detection.

### Q30. How does Mongoose `.populate()` work and what is the underlying MongoDB mechanism?
**Answer:** `.populate()` replaces a referenced `ObjectId` field with the actual document from the target collection. Under the hood, Mongoose performs a secondary query or an internal `$lookup` aggregation to join the documents before returning the result to Express.

### Q31. What is the Caseload Partition Theorem verified in Phase 10 and 11?
**Answer:** The mathematical equation:
$$\text{Active Cases} + \text{Pending Cases} + \text{Closed Cases} \equiv \text{Total System Cases}$$
Where:
- **Active:** `HEARING_IN_PROGRESS`, `UNDER_REVIEW`, `APPEALED`.
- **Pending:** `FILED`, `JUDGMENT_RESERVED`.
- **Closed:** `CLOSED`.  
Our automated audit confirms zero unaccounted cases and zero overlap across all 34 dockets.

### Q32. How is Mongoose configured to handle database connection loss?
**Answer:** `src/config/db.js` sets `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`, and binds connection event listeners (`connected`, `error`, `disconnected`). It reconnects automatically or falls back to `mongodb-memory-server` during local offline testing.

### Q33. Why is MongoDB root authentication configured with SCRAM-SHA-256?
**Answer:** Salted Challenge Response Authentication Mechanism (SCRAM-SHA-256) is MongoDB's default cryptographic challenge-response authentication protocol. It ensures passwords are never transmitted in cleartext over the network.

### Q34. How does the seeder script ensure idempotency?
**Answer:** `seed_demo.js` inspects whether existing accounts are present. If the database is empty or explicitly invoked, it clears stale records, resets counter indexes, creates bcrypt-hashed demo credentials, links relational ObjectIds consistently, and writes valid binary PDF files to the uploads volume.

### Q35. What is soft deletion versus hard deletion and which does JurisFlow use?
**Answer:**
- **Hard Deletion:** Physically running `deleteOne()` or `deleteMany()` removing records from storage.
- **Soft Deletion:** Updating a status flag (e.g. marking hearing as `CANCELLED` or client as `INACTIVE`) while preserving the audit trail. JurisFlow prefers soft cancellation for hearings and clients to preserve legal evidentiary history.

### Q36. How does Mongoose prevent returning user passwords in queries?
**Answer:** The User schema defines `password: { type: String, select: false }`. By default, queries like `User.find()` omit the password field. It is only included when explicitly requested via `.select('+password')` during the authentication verification step.

### Q37. What is an aggregation pipeline in MongoDB and where is it used?
**Answer:** An aggregation pipeline is a framework for multi-stage data processing (`$match`, `$group`, `$sort`, `$project`). In JurisFlow, it is used in the Reports Engine (`report.controller.js`) to compute case status breakdowns, hearing distribution across court complexes, and client caseload counts in a single atomic database query.

### Q38. How is MongoDB transaction support structured?
**Answer:** In replica sets, MongoDB supports multi-document ACID transactions using `session.startTransaction()`. While our current single-node container deployment uses atomic updates (`findOneAndUpdate`), the controllers are designed to wrap multi-step writes (such as case creation + client history update + notification dispatch) in sessions when clustered.

---

## Part 5: Authentication, JWT & bcrypt Security

### Q39. What is JWT and what are its three components?
**Answer:** JSON Web Token (RFC 7519) is a compact, URL-safe means of representing claims securely between two parties. Its three parts separated by dots are:
1. **Header:** Algorithm & token type (e.g. `{"alg": "HS256", "typ": "JWT"}`).
2. **Payload:** Claims containing user metadata (`id`, `email`, `role`) and expiration (`exp`).
3. **Signature:** Cryptographic signature calculated as `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`.

### Q40. Why is JWT considered stateless?
**Answer:** Because the server does not need to store active session IDs in a centralized database or cache (like Redis). The token itself contains all verified claims and signature. Any server possessing the secret key can authenticate the user simply by verifying the signature.

### Q41. How does bcrypt work and what is a salt round?
**Answer:** `bcrypt` is an adaptive one-way cryptographic hashing function based on the Blowfish cipher. It incorporates a random "salt" to prevent rainbow table attacks. The "salt round" (work factor, set to 10 in JurisFlow) determines the number of hashing iterations ($2^{10} = 1024$ rounds), making brute-force cracking computationally prohibitive.

### Q42. Why can you not decrypt a bcrypt hash?
**Answer:** Because bcrypt is a one-way mathematical hashing algorithm, not an encryption algorithm. To verify a password, the system hashes the plaintext attempt using the exact same salt stored inside the hash and checks if the outputs match (`bcrypt.compare`).

### Q43. What is dual-channel JWT transmission in JurisFlow?
**Answer:** Upon successful login, the server returns the JWT token in two simultaneous channels:
1. Inside the JSON response body (`data.token`) for Axios HTTP Authorization headers.
2. Inside an `HttpOnly` cookie (`SameSite: lax`, 24h validity). This defense-in-depth approach shields the token from cross-site scripting (XSS) extraction while supporting RESTful API clients.

### Q44. How does JurisFlow prevent privilege escalation during public registration?
**Answer:** In `auth.controller.js`, the registration handler explicitly ignores any `role` value supplied in the public registration request body and hardcodes `role: 'CLIENT'`. Administrative or Lawyer accounts can only be provisioned by an authenticated Admin through `/api/users`.

### Q45. What happens when a JWT token expires?
**Answer:** When the token surpasses its 24-hour expiration (`exp`), `jwt.verify()` throws a `TokenExpiredError`. The authentication middleware catches this, denies access, and returns HTTP 401 Unauthorized with message `"Token has expired. Please log in again."`.

### Q46. How is user logout handled?
**Answer:** The client drops the token from `localStorage` and resets `AuthContext`. Simultaneously, the server endpoint `/api/auth/logout` clears the `HttpOnly` authentication cookie by setting its expiration date to the past.

### Q47. What is the difference between Authentication and Authorization?
**Answer:**
- **Authentication (401 Unauthorized):** Verifies *who* the user is (e.g. validating email and password).
- **Authorization (403 Forbidden):** Verifies *what* the user is permitted to do based on their role (e.g. verifying if a Litigant Client can delete a case).

### Q48. Where is the JWT Secret stored and how is it protected?
**Answer:** It is stored as an environment variable `JWT_SECRET`. It is never hardcoded in source code. In Docker, it is injected via `.env` or Compose environment variables. In Kubernetes, it is injected securely from `jurisflow-secrets`.

---

## Part 6: Role-Based Access Control (RBAC)

### Q49. How is RBAC implemented in Express middleware?
**Answer:** Through the higher-order middleware function `authorizeRoles(...allowedRoles)` in `src/middleware/role.middleware.js`. It runs immediately after `authenticate`. It inspects `req.user.role`; if the role is not present in the allowed list, it halts execution and returns HTTP 403 Forbidden.

### Q50. Can a Litigant Client view cases belonging to another client?
**Answer:** No. In `case.controller.js`, when `req.user.role === 'CLIENT'`, the controller automatically looks up the client profile linked to that user account and forces the query filter to `{ client: clientId }`. The client is mathematically isolated and cannot query other clients' litigation matters.

### Q51. What error code is returned when a Client attempts to create a legal case?
**Answer:** HTTP 403 Forbidden with message `"Access denied. Role CLIENT does not have permission to perform this action."`. Only Admins and Clerks are authorized to register new dockets.

### Q52. Can a Lawyer access another Lawyer's private case dockets?
**Answer:** No. When a Lawyer queries `/api/cases`, the controller scopes the database query to `{ assignedLawyer: req.user.id }`. Only firm Admins have global multi-lawyer visibility.

### Q53. How is confidential document protection enforced?
**Answer:** Documents have a boolean flag `isConfidential`. In `document.controller.js`, if a document has `isConfidential: true` and the requesting user has `role: 'CLIENT'`, access is immediately blocked with HTTP 403 Forbidden, even if the case belongs to that client.

### Q54. How does the frontend dynamically adapt to the user's role?
**Answer:** `DashboardLayout.jsx` reads `user.role` from `AuthContext` and filters the sidebar navigation links. Litigant Clients do not see links to "User Management" or "Analytics Reports", and the main `/dashboard` route dynamically renders the role-specific view component (`AdminDashboardView`, `LawyerDashboardView`, `ClientDashboardView`, or `ClerkDashboardView`).

---

## Part 7: Case Management & Reference Generator

### Q55. What is the format of the unique Case Reference Number in JurisFlow?
**Answer:** The standardized format is `LCMS-YYYY-XXXX`, where `LCMS` stands for Legal Case Management System, `YYYY` is the current four-digit year (e.g. `2026`), and `XXXX` is a zero-padded four-digit sequence counter (e.g. `LCMS-2026-0001`).

### Q56. How does the system generate unique reference numbers without race conditions?
**Answer:** In `src/utils/referenceGenerator.js`, the generator queries the highest existing sequence counter for the current year, increments it by 1, formats it with leading zeros, and relies on MongoDB's unique index on `caseReference` as a secondary concurrency guard.

### Q57. What are the six legal case statuses supported by JurisFlow?
**Answer:**
1. `FILED` — Initial registry filing and docketing.
2. `UNDER_REVIEW` — Scrutiny by clerk and assigned advocate.
3. `HEARING_IN_PROGRESS` — Active trial and court hearings ongoing.
4. `JUDGMENT_RESERVED` — Final arguments concluded, awaiting court judgment.
5. `CLOSED` — Final decree or disposal order pronounced.
6. `APPEALED` — Challenged before an appellate higher court bench.

### Q58. How does case progress tracking work?
**Answer:** Each case document holds a `stage` string (e.g. "Pleadings", "Evidence", "Final Arguments") and an integer `progress` (0 to 100). When lawyers or clerks update the trial stage, the progress bar updates in real-time across the client and lawyer dashboards.

---

## Part 8: Court Hearings & Conflict Prevention Engine

### Q59. What fields are required to schedule a court hearing?
**Answer:** Linked case (`caseId`), case reference number, court name (e.g. "High Court of Judicature"), courtroom (e.g. "Courtroom #304"), judge name (e.g. "Hon. Justice V.K. Shinde"), hearing date (`YYYY-MM-DD`), hearing time (`HH:MM`), hearing purpose, and status.

### Q60. How does the Conflict Prevention Engine detect judge double-booking?
**Answer:** In `conflict.service.js`, the engine converts the incoming date and time into a `startDateTime` and calculates `endDateTime` using `durationMinutes`. It queries the `hearings` collection for any non-cancelled hearing where `judgeName` matches and the time intervals overlap:
$$(Start_A < End_B) \land (End_A > Start_B)$$
If a match is found, scheduling is rejected with HTTP 409 Conflict.

### Q61. How does the Conflict Prevention Engine detect courtroom allocation overlaps?
**Answer:** Similar to judge conflict detection, it queries the `hearings` collection matching `courtName` and `courtroom` across the same time window. If another hearing is already assigned to that physical courtroom, the booking is blocked.

### Q62. What hearing statuses exist in JurisFlow?
**Answer:**
- `SCHEDULED` — Upcoming active listing.
- `ADJOURNED` — Postponed to a future date with adjournment reason.
- `COMPLETED` — Hearing concluded and proceedings recorded.
- `CANCELLED` — Soft-cancelled hearing removed from the daily cause roster.

---

## Part 9: Task Management & Deadlines

### Q63. What are the task priority levels in JurisFlow?
**Answer:** Four priority tiers: `LOW`, `MEDIUM`, `HIGH`, and `URGENT`. Each tier is visually coded in the UI (Crimson for Urgent, Amber for High, Blue for Medium, Slate for Low).

### Q64. How does JurisFlow automatically identify overdue tasks?
**Answer:** In `task.controller.js` and `task.model.js`, task status is dynamically evaluated against `new Date()`. If `task.status !== 'COMPLETED'` and `task.deadline < new Date()`, the system flags `isOverdue: true` and exposes status as `OVERDUE` in API aggregates and dashboard widgets.

### Q65. What is the `isClientVisible` flag on tasks?
**Answer:** A boolean privacy toggle. Lawyers frequently create internal procedural tasks (e.g. "Internal strategy discussion" or "Cross-examination prep") that should remain hidden from clients. When `isClientVisible: true`, the task is an action item designated for the litigant (e.g. "Submit address proof"). Litigant Clients can only see tasks where `isClientVisible: true`.

### Q66. What happens when a task is marked completed?
**Answer:** The backend endpoint `PATCH /api/tasks/:id/status` updates `status: 'COMPLETED'`, records the exact timestamp in `completedAt`, and clears any pending overdue notifications.

---

## Part 10: Document Vault, Multer & Magic Bytes

### Q67. What is Multer and how is it used in JurisFlow?
**Answer:** Multer is a Node.js streaming middleware for handling `multipart/form-data`, primarily used for uploading files. In JurisFlow, it is configured with disk storage pointing to `/usr/src/app/src/uploads` with a maximum file size limit of 10 MB.

### Q68. What are magic bytes (file signatures) and why are extension checks alone insufficient?
**Answer:** File extensions (like `.pdf`) can be easily spoofed by malicious users renaming executable files (like `malicious.exe` to `brief.pdf`). Magic bytes are unique hexadecimal binary sequences located at the very beginning of a file:
- **PDF:** `%PDF` (`0x25 0x50 0x44 0x46`)
- **PNG:** `0x89 0x50 0x4E 0x47`
- **JPEG:** `0xFF 0xD8 0xFF`
- **DOCX / ZIP:** `PK\x03\x04` (`0x50 0x4B 0x03 0x04`)  
JurisFlow inspects the physical file buffer before accepting the document.

### Q69. What happens if a user uploads a disguised script as a PDF?
**Answer:** `upload.middleware.js` reads the first 8 bytes of the uploaded file. If the bytes do not match `%PDF`, the file is immediately deleted from disk via `fs.unlinkSync()`, and Express returns HTTP 400 Bad Request with message `"Fraudulent file detected: Content header does not match declared document type."`.

### Q70. How does JurisFlow prevent directory traversal attacks during file download?
**Answer:** In `document.controller.js`, the download endpoint uses `path.basename()` to strip any malicious path sequences (like `../../etc/passwd`). Furthermore, file paths are never exposed to clients; clients only receive opaque document IDs (e.g. `/api/documents/6af0a67c/download`).

### Q71. How is document streaming download implemented in Express?
**Answer:** Using `res.download(absolutePath, originalFileName)`. This streams the binary file directly from disk to the client with `Content-Disposition: attachment` without buffering the entire file in Node.js server RAM.

### Q72. How are uploaded documents persisted in Docker and Kubernetes?
**Answer:**
- In Docker Compose: mounted to named persistent volume `document_vault` at `/usr/src/app/src/uploads`.
- In Kubernetes: mounted to PersistentVolumeClaim `jurisflow-vault-pvc` (2Gi) at `/usr/src/app/src/uploads`.

---

## Part 11: Four Mandatory Reports & Export Engine

### Q73. What are the four mandatory reports implemented in JurisFlow?
**Answer:**
1. **Case Status Report (`/api/reports/case-status`):** Caseload distribution across statuses, active vs closed breakdown, hearing progress.
2. **Hearing Calendar Report (`/api/reports/hearing-calendar`):** Chronological cause listings, courtroom allocations, scheduled vs adjourned metrics.
3. **Pending Tasks Report (`/api/reports/pending-tasks`):** Tasks by priority, days remaining, overdue distribution.
4. **Client Case Summary Report (`/api/reports/client-summary`):** Retained caseload per corporate/individual client.

### Q74. How is CSV export implemented?
**Answer:** Via `src/utils/csvExport.js` adhering to RFC 4180. The service serializes MongoDB query results into comma-separated values, wraps fields containing commas or quotes in double quotes, escapes nested quotes (`""`), sets headers `Content-Type: text/csv`, and streams the file as an attachment.

### Q75. How is printable PDF export implemented?
**Answer:** In the React frontend (`ReportsPage.jsx`), printable reports are structured with print-optimized CSS (`@media print`). Clicking "Export PDF" opens the browser's native print engine pre-formatted with official university headers, student metadata, data tables, and signature blocks.

### Q76. Who is authorized to access the Reports Engine?
**Answer:** Full access is restricted to `ADMIN`. Lawyers can access a scoped summary of their own assigned caseload, while litigating Litigant Clients are blocked with HTTP 403 Forbidden.

---

## Part 12: Notification Center & Scheduled Cron

### Q77. What types of notifications does JurisFlow generate?
**Answer:**
1. `HEARING_ALERT` — Upcoming court appearance listings and schedule updates.
2. `DEADLINE_ALERT` — Approaching task deadlines (within 24 hours).
3. `CASE_UPDATE` — Trial stage transitions and new document filings.
4. `SYSTEM` — Administrative security alerts.

### Q78. How does the automated background reminder cron work?
**Answer:** In `server.js`, `startScheduledReminderCron(5 * 60 * 1000)` launches a timer that executes every 5 minutes. It scans for court hearings scheduled within 48 hours and tasks due within 24 hours, automatically dispatching notifications to assigned advocates and clients.

### Q79. How does JurisFlow prevent duplicate notification spam?
**Answer:** Through unique deduplication keys: `hash(recipientId + eventType + entityId + eventDate)`. The notification schema enforces a unique index on `deduplicationKey`. If the scanner runs again, duplicate inserts are silently caught and ignored.

### Q80. How are notifications marked as read?
**Answer:**
- Single read: `PATCH /api/notifications/:id/read` sets `isRead: true`.
- Bulk read: `PATCH /api/notifications/read-all` marks all unread notifications for the authenticated user as read in an atomic update.

---

## Part 13: Docker & Multi-Container Architecture

### Q81. What is Docker and what is containerization?
**Answer:** Docker is an open-source platform that packages an application and all its dependencies (runtime, libraries, system tools) into an isolated, lightweight container image. Containerization eliminates the "it works on my machine" problem by guaranteeing identical execution across development, testing, and production.

### Q82. Explain the multi-stage build used in the frontend Dockerfile.
**Answer:** Multi-stage builds use multiple `FROM` instructions in a single Dockerfile:
- **Stage 1 (Builder):** Uses `node:20-alpine` to install dependencies and compile the production Vite React SPA bundle into static files (`dist/`).
- **Stage 2 (Runtime):** Uses a tiny `nginx:alpine` image, copies only the compiled static assets from Stage 1, and discards all Node.js runtimes and dev tools.  
This reduced the frontend image size from over 350 MB to just **26.4 MB**.

### Q83. What security practices are implemented in the backend Dockerfile?
**Answer:**
1. Uses official lightweight LTS base image: `node:20-alpine`.
2. Installs production dependencies only via `npm ci --omit=dev`.
3. Runs under unprivileged user `USER node` (UID 1000) rather than root.
4. Pre-creates uploads directory with `chown -R node:node`.
5. Defines an internal `HEALTHCHECK` hitting `http://127.0.0.1:5000/api/health`.

### Q84. What is Docker Compose and what services does it define in JurisFlow?
**Answer:** Docker Compose is a tool for defining and running multi-container Docker applications via YAML. In `docker-compose.yml`, JurisFlow defines three services:
1. `mongodb` (`mongo:7.0`)
2. `backend` (`legal-case-management-portal-backend`)
3. `frontend` (`legal-case-management-portal-frontend`)

### Q85. How do containers communicate with each other in Docker Compose?
**Answer:** Through an isolated user-defined bridge network `jurisflow-network`. Docker provides automatic internal DNS resolution: the backend connects to MongoDB using hostname `mongodb:27017`, and Nginx proxies to `backend:5000`.

### Q86. Why did you map the backend port to 5001 on the host machine?
**Answer:** On macOS Monterey, Ventura, Sonoma, and Sequoia, the native `ControlCenter` AirPlay Receiver daemon binds to port 5000. Mapping host port `5001:5000` eliminates port conflicts while preserving the standard internal port 5000 inside the Docker network.

### Q87. Why was MongoDB's port restricted from `0.0.0.0:27017` to `127.0.0.1:27017`?
**Answer:** Binding to `0.0.0.0:27017` exposes the database to all external network interfaces on the host. Restricting to `127.0.0.1:27017` ensures MongoDB is only reachable via loopback on the host, preventing unauthorized external network intrusion.

### Q88. What is the purpose of `.dockerignore`?
**Answer:** Similar to `.gitignore`, `.dockerignore` prevents files like `.env`, `node_modules`, test artifacts, and Git metadata from being copied into the Docker build context, speeding up builds and preventing secret leaks.

---

## Part 14: Docker Volumes & Data Persistence

### Q89. What is the difference between a container layer and a Docker volume?
**Answer:**
- **Container Layer:** Ephemeral and read-write; all data written directly to a container is destroyed when the container is deleted.
- **Docker Volume:** Persistent storage managed by Docker outside the container's Union File System (in `/var/lib/docker/volumes`). Data survives container recreation, restarts, and image updates.

### Q90. What named volumes are configured in `docker-compose.yml`?
**Answer:**
1. `mongodb_data` — mounted at `/data/db` in the MongoDB container to preserve all database records.
2. `document_vault` — mounted at `/usr/src/app/src/uploads` in the backend container to preserve uploaded case files.

### Q91. How did you verify that data persists across container restarts?
**Answer:** Using `verify_phase12_docker.js`:
1. Created a canary case docket (`LCMS-2026-0033`) and uploaded a PDF petition.
2. Executed `docker compose restart backend`.
3. Re-queried the API after the container restored health.
4. Confirmed the docket existed in MongoDB and the exact 329-byte PDF file was downloaded intact.

### Q92. What happens if you run `docker compose down -v`?
**Answer:** The `-v` flag instructing Docker to destroy named volumes will delete `mongodb_data` and `document_vault`, resulting in total data loss. Therefore, standard shutdown must strictly use `docker compose down` without `-v`.

---

## Part 15: Kubernetes Architecture & Concepts

### Q93. What is Kubernetes (K8s) and what problem does it solve?
**Answer:** Kubernetes is an open-source container orchestration platform that automates the deployment, scaling, load balancing, health monitoring, and self-healing of containerized applications across a cluster of nodes.

### Q94. What is a Kubernetes Pod?
**Answer:** A Pod is the smallest deployable computing unit in Kubernetes. It encapsulates one or more containers that share storage resources, an IP network address, and options that govern how the container(s) run.

### Q95. What is the difference between a Deployment and a StatefulSet?
**Answer:**
- **Deployment:** Ideal for stateless applications (like our React frontend and Express backend). Pods are interchangeable, have random generated names (e.g. `frontend-7d9f-x1`), and can be created/deleted in any order.
- **StatefulSet:** Designed for stateful workloads (like MongoDB). Pods have stable, predictable network identities (`mongodb-0`), ordered graceful deployment and termination, and dedicated persistent volume attachments via `volumeClaimTemplates`.

### Q96. What is a Kubernetes Service and what types exist?
**Answer:** A Service is an abstract way to expose an application running on a set of Pods as a network service. Types include:
- `ClusterIP` (Default): Exposes service on a cluster-internal IP (accessible only within cluster).
- `NodePort`: Exposes service on each node's IP at a static port (30000–32767).
- `LoadBalancer`: Provisions a cloud provider's external load balancer.
- `ExternalName`: Maps a service to a DNS name.

### Q97. What is an Ingress and how does it differ from a NodePort or LoadBalancer?
**Answer:** Ingress operates at Layer 7 (HTTP/HTTPS) of the OSI model. It acts as an intelligent reverse proxy routing traffic to multiple internal Services based on hostnames (`jurisflow.local`) and URL paths (`/` vs `/api`) under a single external IP, eliminating the need for expensive dedicated LoadBalancers per service.

### Q98. What is a ConfigMap versus a Secret?
**Answer:**
- **ConfigMap:** Stores non-sensitive configuration data in plain text key-value pairs (e.g. `PORT: "5000"`, `NODE_ENV: "production"`).
- **Secret:** Stores sensitive data (passwords, tokens, keys) encoded in Base64 or stringData. Secrets are decoupled from manifests to prevent accidental Git leaks.

### Q99. What are Persistent Volumes (PV) and Persistent Volume Claims (PVC)?
**Answer:**
- **Persistent Volume (PV):** A piece of physical storage provisioned in the cluster (e.g. cloud disk or host directory).
- **Persistent Volume Claim (PVC):** A request for storage by a user/pod specifying storage size (e.g. 2Gi) and access mode (`ReadWriteOnce`). The PVC binds to an available matching PV.

### Q100. What is the difference between `ReadWriteOnce` and `ReadWriteMany`?
**Answer:**
- `ReadWriteOnce` (RWO): Volume can be mounted as read-write by a single node at a time.
- `ReadWriteMany` (RWX): Volume can be mounted as read-write by multiple nodes simultaneously (e.g. NFS or AWS EFS).

### Q101. Why is the backend deployment configured with a single replica?
**Answer:** Because local Kubernetes storage classes provision `ReadWriteOnce` (RWO) PVCs. If multiple backend pods were deployed on different nodes attempting to mount the same RWO volume, volume attachment collisions would occur. Thus, single-writer (`replicas: 1`, `strategy: Recreate`) guarantees storage integrity.

### Q102. What are Kubernetes Health Probes?
**Answer:** Probes configured in pod specs to determine container operational state:
1. **Startup Probe:** Checks if the application has completed initialization (useful for slow bcrypt seeder scripts).
2. **Liveness Probe:** Detects deadlocks; if failed, Kubernetes kills and restarts the container.
3. **Readiness Probe:** Detects if the container is ready to accept user network traffic; if failed, the pod is removed from Service endpoints.

### Q103. What is a Kubernetes Namespace?
**Answer:** A virtual cluster boundary inside a physical cluster. Namespaces (like `jurisflow`) provide scope for resource names, resource quotas, and access control, isolating project resources from other cluster workloads.

### Q104. How does CoreDNS work inside a Kubernetes cluster?
**Answer:** CoreDNS is the internal cluster DNS service. Workloads resolve services using the pattern: `<service-name>.<namespace>.svc.cluster.local`. In our cluster, the backend resolves MongoDB via `mongodb.jurisflow.svc.cluster.local:27017`.

---

## Part 16: Kubernetes Manifests in JurisFlow

### Q105. Explain the resources created in `kubernetes/` directory.
**Answer:**
1. `namespace.yaml` — Defines `jurisflow`.
2. `configmap.yaml` — Non-sensitive environment variables.
3. `secret.example.yaml` — Secure template for passwords and JWT keys.
4. `mongodb/statefulset.yaml` & `service.yaml` — Mongo 7.0 with 5Gi storage.
5. `backend/deployment.yaml`, `service.yaml`, `pvc.yaml` — Express API with 2Gi vault storage.
6. `frontend/deployment.yaml`, `service.yaml` — React/Nginx SPA with 2 replicas.
7. `ingress.yaml` — Layer 7 routing for `jurisflow.local`.

### Q106. How does the frontend communicate with the backend inside Kubernetes?
**Answer:** The React app sends API calls to `/api/*`. The frontend pod's Nginx reverse proxy intercepts `/api/*` and proxies it to `http://backend:5000/api/`, which CoreDNS resolves to the `backend` ClusterIP service.

### Q107. Why are MongoDB services configured as `ClusterIP`?
**Answer:** For strict database security. A database should never be exposed to the public internet via `LoadBalancer` or `NodePort`. `ClusterIP` ensures only authorized backend pods within the cluster can communicate with MongoDB.

### Q108. How do you verify Kubernetes manifests offline without a running cluster?
**Answer:** Using `verify_phase13_kubernetes.js`. It performs static analysis and Abstract Syntax Tree (AST) validation verifying syntax, API versions, mandatory labels, probe paths, security contexts, and volume mounts.

### Q109. How would you scale the frontend deployment in Kubernetes?
**Answer:** By running: `kubectl scale deployment frontend --replicas=4 -n jurisflow`. Because the frontend is completely stateless, Kubernetes will instantaneously spawn two additional pods, and the `frontend` service will distribute incoming traffic across all four pods.

### Q110. How do you create secrets securely in a cluster without committing files to Git?
**Answer:** Using the imperative `kubectl create secret` command:
```bash
kubectl create secret generic jurisflow-secrets -n jurisflow \
  --from-literal=mongo-root-username=admin \
  --from-literal=mongo-root-password="$(openssl rand -base64 24)" \
  --from-literal=jwt-secret="$(openssl rand -hex 32)"
```

### Q111. How do you access the application using `port-forward`?
**Answer:** Run:
```bash
kubectl port-forward svc/frontend 3000:80 -n jurisflow
```
This forwards host port 3000 directly to port 80 of the frontend service, allowing access at `http://localhost:3000`.

### Q112. What security context settings are configured on the backend pod?
**Answer:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
```
This guarantees the container runs as unprivileged user `node`, and mounted volumes inherit ownership permissions for user 1000.

---

## Part 17: Git, Testing, Benchmarks & Debugging

### Q113. What is Git and how did you structure your commit history?
**Answer:** Git is a distributed version control system. JurisFlow followed the Conventional Commits specification with atomic commits per phase:
- `feat(auth): complete Phase 5 authentication and RBAC`
- `feat(cases): complete Phase 6 case and client management`
- `feat(docker): complete Phase 12 containerization with Docker Compose`
- `feat(kubernetes): complete Phase 13 Kubernetes manifests and orchestration`

### Q114. How does `verify_e2e.js` use Puppeteer for browser automation?
**Answer:** Puppeteer launches a headless instance of Google Chrome, navigates to `http://localhost:3000`, types login credentials, clicks buttons, validates DOM element presence (like role badges and case tables), simulates mobile device viewports (375x812 iPhone), and saves PNG screenshots to disk.

### Q115. What performance benchmarks were measured on the database?
**Answer:** In `verify_phase11.js`, large-dataset query execution times were profiled:
- Admin Governance Dashboard: **18 ms**
- Case Status Report: **16 ms**
- Hearing Calendar Schedule: **17 ms**
- Cases Search & Paginated Index: **7 ms**  
All queries completed well within real-time thresholds (< 50 ms).

### Q116. How did you troubleshoot the macOS AirPlay port 5000 collision in Phase 12?
**Answer:** By running `lsof -i :5000` to identify the occupying process (`ControlCenter`). Instead of disabling system services, `docker-compose.yml` was configured to map backend host port `5001:5000`, while frontend Nginx proxied `/api/` internally on port 5000, resolving the issue with zero host modifications.

### Q117. How do you inspect live logs of a failing container or pod?
**Answer:**
- Docker Compose: `docker compose logs -f <service_name>`
- Kubernetes: `kubectl logs -f deployment/<deployment_name> -n jurisflow`

### Q118. What is the difference between `npm install` and `npm ci`?
**Answer:**
- `npm install`: Updates `package-lock.json` and installs permissive dependencies.
- `npm ci`: (Clean Install) Deletes existing `node_modules` and strictly installs exact dependency versions from `package-lock.json`. It is faster, deterministic, and mandatory for production CI/CD and Docker builds.

### Q119. What are the key limitations of the current JurisFlow implementation?
**Answer:**
1. Single-node local storage: Document vault uses `ReadWriteOnce` storage, limiting backend deployment to a single replica unless cloud object storage (S3) is introduced.
2. Local offline Kubernetes: Manifests are verified offline, pending a live cluster runtime deployment.
3. SMS Gateway: Notifications are currently in-app; integration with external SMS gateways (Twilio) is a future enhancement.

### Q120. If an examiner asks: "Can you demonstrate the application right now?", what do you do?
**Answer:**
1. Confirm Docker Desktop is running.
2. Run `docker compose up -d` in the terminal.
3. Open browser to `http://localhost:3000`.
4. Click the demo login button (e.g. Admin or Lawyer).
5. Show live dashboard metrics, navigate to Cases (`LCMS-2026-0001`), show the Hearing Calendar with conflict prevention, upload a legal document, and download a CSV Case Status Report.
