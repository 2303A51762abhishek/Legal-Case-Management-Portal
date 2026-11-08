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
- **Database:** MongoDB & Mongoose (Schema & Connection in Phase 4)
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
│   │   ├── config/               # Environment & System Config
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middleware/           # JWT Auth, RBAC guards, Centralized Error Handling
│   │   ├── models/               # MongoDB Mongoose Schemas (Phase 4)
│   │   ├── routes/               # Modular REST API endpoints
│   │   ├── services/             # JWT & Business Services
│   │   ├── utils/                # Password hashing & standardized responses
│   │   ├── uploads/              # Authorized case documents vault
│   │   ├── app.js                # Express Application Configuration
│   │   └── server.js             # HTTP Server Entrypoint
│   ├── .env.example              # Environment variables template
│   └── package.json
│
├── docker/                       # Dockerfiles and Compose configs (Phase 12)
├── kubernetes/                   # Deployments, Services, ConfigMaps (Phase 13)
├── docs/                         # Architecture, API & Viva Voce Q&A docs
└── README.md
```

---

## 3. Getting Started & Running the Application

### Prerequisites
- Node.js (v18+ or v20+ recommended, tested on v25.9)
- npm (v9+)
- Git

### A. Running the React Frontend (Phase 2)
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the Vite development server
npm run dev -- --host --port 3000
```
Open **`http://localhost:3000/`** in your browser.
Use the **View Role** toggle in the top bar to inspect:
- **`ADMIN`**: Managing Partner & Chief Administrator
- **`LAWYER`**: Lead Litigation Counsel (Adv. Mamillapally Abhishek)
- **`CLIENT`**: Corporate Litigant (Vikramaditya Rao)
- **`CLERK`**: Registry & Bench Clerk (Suresh Chandra)

---

### B. Running the Express Backend (Phase 3)
```bash
# Navigate to the backend directory
cd backend

# Install backend dependencies (first time only)
npm install

# Start the Node.js API server
node src/server.js
# Or for auto-reload during development:
npm run dev
```

The backend server listens on **`http://127.0.0.1:5000`** (or `http://localhost:5000`).

---

## 4. API Endpoints Map (Phase 3 Initial Structure)

| Endpoint | HTTP Method | Access Level | Description |
| :--- | :---: | :---: | :--- |
| `/api/health` | `GET` | Public | System health check & course metadata |
| `/api/auth/register` | `POST` | Public | User registration endpoint |
| `/api/auth/login` | `POST` | Public | JWT authentication & login |
| `/api/auth/me` | `GET` | Authenticated | Retrieve current user profile |
| `/api/users` | `GET`, `POST` | **ADMIN** | User administration |
| `/api/clients` | `GET`, `POST` | **ADMIN, LAWYER, CLERK** | Client records & intake |
| `/api/cases` | `GET`, `POST` | Authenticated (Role Filtered) | Case registrations & dockets |
| `/api/hearings` | `GET`, `POST` | Authenticated | Court hearing schedules & calendar |
| `/api/tasks` | `GET`, `POST` | **ADMIN, LAWYER, CLERK** | Legal deadlines & task tracking |
| `/api/documents` | `GET`, `POST` | Authenticated | Legal briefs & document vault |
| `/api/reports/*` | `GET` | **ADMIN, LAWYER, CLERK** | 4 mandatory analytical reports |
| `/api/notifications` | `GET` | Authenticated | In-app alerts & calendar notifications |

---

## 5. Health Check Verification

You can verify the backend is running via curl or browser:

```bash
curl -s http://127.0.0.1:5000/api/health
```

Expected JSON response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "JurisFlow Backend Service is Operational",
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
    }
  }
}
```
