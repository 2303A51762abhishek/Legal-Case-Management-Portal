# JurisFlow System Architecture & Technical Design Specification

**Project:** Legal Case and Court Hearing Management Portal (JurisFlow)  
**Student:** MAMILLAPALLY ABHISHEK  
**Roll Number:** 2303A51762  
**Course:** DevOps & Full Stack (B.Tech IV Year I Semester)  
**Academic Year:** 2026–2027  

---

## 1. Overall System Architecture

JurisFlow is architected as an enterprise-grade, multi-tiered full-stack legal practice management portal adhering to micro-tier separation of concerns:

```mermaid
flowchart TD
    subgraph PresentationTier ["Presentation Tier (React.js SPA)"]
        UI["Tailwind CSS Responsive UI (Navy #0F172A Theme)"]
        Router["React Router v6 (Role Protected Routes)"]
        State["React AuthContext + LocalStorage JWT Session"]
        AxiosClient["Axios HTTP Client + Interceptors"]
    end

    subgraph ReverseProxyGateway ["Reverse Proxy & Web Gateway Tier"]
        Nginx["Nginx Alpine (HTTP/1.1 Proxy + Streaming)"]
        Ingress["Kubernetes Ingress (jurisflow-ingress)"]
    end

    subgraph ApplicationTier ["Application Logic Tier (Node.js & Express.js)"]
        SecurityMW["Helmet, CORS, RateLimiter, CookieParser"]
        AuthMW["JWT Verification & RBAC Guards"]
        MulterMW["Multer Streaming Upload + Magic-Byte Validator"]
        BusinessControllers["Controllers: Cases, Hearings, Tasks, Clients, Reports, Notifications"]
        CronService["Background Scheduled Reminder Cron (5-min scanner)"]
    end

    subgraph DataStorageTier ["Data Storage Tier (MongoDB 7.0 & Mongoose)"]
        MongooseODM["Mongoose Schema Layer (Indexes, Validation)"]
        MongoDB[(MongoDB Community 7.0 Engine)]
        VaultStorage[("Document Vault Storage: /usr/src/app/src/uploads")]
    end

    subgraph InfrastructureTier ["DevOps & Container Orchestration Tier"]
        DockerCompose["Docker Compose (jurisflow-network)"]
        K8sManifests["Kubernetes (jurisflow Namespace: StatefulSet, Deployments, PVCs)"]
    end

    UI --> Router --> State --> AxiosClient
    AxiosClient --> Ingress --> Nginx
    Nginx --> SecurityMW --> AuthMW
    AuthMW --> MulterMW --> BusinessControllers
    BusinessControllers --> CronService
    BusinessControllers --> MongooseODM --> MongoDB
    MulterMW --> VaultStorage
    BusinessControllers -.-> InfrastructureTier
```

---

## 2. Frontend / Backend / Database Communication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Litigant / Lawyer / Clerk / Admin
    participant Frontend as React SPA (Port 3000)
    participant Nginx as Nginx Reverse Proxy (Port 80)
    participant Backend as Express REST API (Port 5000)
    participant DB as MongoDB 7.0 (Port 27017)
    participant Vault as Persistent Document Vault

    User->>Frontend: Enters credentials on LoginPage
    Frontend->>Nginx: POST /api/auth/login
    Nginx->>Backend: Proxy POST /api/auth/login
    Backend->>DB: User.findOne({ email }).select('+password')
    DB-->>Backend: User Document (bcrypt hash)
    Backend->>Backend: bcrypt.compare(inputPassword, hashedPassword)
    Backend->>Backend: Generate signed JWT (24h validity)
    Backend-->>Nginx: HTTP 200 OK + JWT Token + HttpOnly Cookie
    Nginx-->>Frontend: Set session in AuthContext & LocalStorage
    Frontend-->>User: Redirect to Role Dashboard (Admin / Lawyer / Client / Clerk)

    User->>Frontend: Uploads Case Brief (Petition PDF)
    Frontend->>Nginx: POST /api/documents/upload (multipart/form-data)
    Nginx->>Backend: Streaming Proxy with 15MB buffer
    Backend->>Backend: Multer saves temp file & inspects magic bytes (%PDF-1.4)
    Backend->>Vault: Write binary file to persistent volume
    Backend->>DB: Document.create({ caseId, title, filePath, mimeType })
    DB-->>Backend: Saved Document Metadata
    Backend-->>Nginx: HTTP 201 Created (Sanitized document object)
    Nginx-->>Frontend: UI updates live document list
```

---

## 3. MongoDB Entity-Relationship (ER) Architecture

The database model is composed of **seven interconnected collections** with strict Mongoose validation, compound indexes, and relational integrity:

```mermaid
erDiagram
    USER ||--o{ CLIENT : manages
    USER ||--o{ CASE : assigned_to
    USER ||--o{ TASK : assigned_or_created
    USER ||--o{ DOCUMENT : uploads
    USER ||--o{ NOTIFICATION : receives

    CLIENT ||--o{ CASE : retains
    CASE ||--o{ HEARING : schedules
    CASE ||--o{ TASK : generates
    CASE ||--o{ DOCUMENT : attaches
    CASE ||--o{ NOTIFICATION : triggers

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "bcrypt hash"
        string role "ADMIN | LAWYER | CLIENT | CLERK"
        string phone
        string accountStatus "ACTIVE | SUSPENDED"
        string barCouncilId
        date createdAt
    }

    CLIENT {
        ObjectId _id PK
        string name
        string email
        string phone
        string organization
        string address
        ObjectId assignedLawyer FK
        ObjectId userAccount FK
        string status "ACTIVE | INACTIVE"
    }

    CASE {
        ObjectId _id PK
        string caseReference UK "LCMS-YYYY-XXXX"
        string title
        string caseType
        string courtName
        string courtroom
        ObjectId client FK
        ObjectId assignedLawyer FK
        date filingDate
        string status "FILED | UNDER_REVIEW | HEARING_IN_PROGRESS | JUDGMENT_RESERVED | CLOSED | APPEALED"
        string stage
        int progress "0 to 100"
        string priority "LOW | MEDIUM | HIGH | URGENT"
    }

    HEARING {
        ObjectId _id PK
        ObjectId case FK
        string caseReference
        string courtName
        string courtroom
        string judgeName
        date hearingDate
        string hearingTime
        int durationMinutes
        string purpose
        string status "SCHEDULED | ADJOURNED | COMPLETED | CANCELLED"
        string notes
    }

    TASK {
        ObjectId _id PK
        string title
        string description
        ObjectId case FK
        ObjectId assignedUser FK
        ObjectId createdBy FK
        string priority "LOW | MEDIUM | HIGH | URGENT"
        date deadline
        string status "PENDING | IN_PROGRESS | COMPLETED | OVERDUE"
        boolean isClientVisible
        date completedAt
    }

    DOCUMENT {
        ObjectId _id PK
        string title
        string documentType "PETITION | AFFIDAVIT | EVIDENCE | ORDER | OTHER"
        ObjectId case FK
        string fileName
        string filePath "Internal safe path"
        int fileSize
        string mimeType
        boolean isConfidential
        ObjectId uploadedBy FK
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipient FK
        ObjectId relatedCase FK
        string title
        string message
        string type "HEARING_ALERT | DEADLINE_ALERT | CASE_UPDATE | SYSTEM"
        boolean isRead
        string deduplicationKey UK
        date createdAt
    }
```

---

## 4. User Role-Based Access Control (RBAC) Matrix

| Capability / API Boundary | Admin | Lawyer | Litigant Client | Court Clerk |
| :--- | :---: | :---: | :---: | :---: |
| **System Administration** (User CRUD & Role Assignments) | ✅ Full Access | ❌ HTTP 403 | ❌ HTTP 403 | ❌ HTTP 403 |
| **Client Management** (Register, Edit, View Case History) | ✅ Full Access | 👁️ Assigned Only | ❌ HTTP 403 | ✅ Register & Maintain |
| **Case Registration** (Generate `LCMS-YYYY-XXXX`) | ✅ Full Access | ❌ HTTP 403 | ❌ HTTP 403 | ✅ Registry Filing |
| **Case Record Viewing** | ✅ All Dockets | 👁️ Assigned Only | 👁️ Own Matters Only | ✅ All Dockets |
| **Case Progress & Stage Editing** | ✅ Full Access | ✅ Assigned Cases | ❌ HTTP 403 | ✅ Cause Entry |
| **Hearing Scheduling & Rescheduling** | ✅ Full Access | ✅ Assigned Cases | 👁️ Read-Only | ✅ Registry Scheduling |
| **Schedule Conflict Detection (Courtroom/Judge)** | ✅ Enforced | ✅ Enforced | N/A | ✅ Enforced |
| **Document Vault Upload & Streaming Download** | ✅ Full Access | ✅ Assigned Cases | 👁️ Non-confidential | ✅ Registry Filing |
| **Confidential Document Protection** | ✅ Allowed | ✅ Allowed | ❌ HTTP 403 Guard | ✅ Allowed |
| **Task Assignment & Overdue Tracking** | ✅ Full Access | ✅ Assigned/Created | 👁️ Designated items | ✅ Registry Tasks |
| **Reports & CSV/PDF Analytics Engine** | ✅ All 4 Reports | 👁️ Practice Summary | ❌ HTTP 403 | 👁️ Cause & Task List |
| **In-App Notifications & Reminders** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 5. Docker Compose Multi-Container Topology (Phase 12)

```mermaid
flowchart TD
    subgraph Host ["Host OS (macOS Apple Silicon / Linux / Windows)"]
        BrowserClient["Browser (http://localhost:3000)"]
        DockerDaemon["Docker Engine Daemon"]
    end

    subgraph BridgeNet ["Bridge Network: jurisflow-network"]
        subgraph FrontContainer ["jurisflow-frontend (nginx:alpine)"]
            NginxServer["Nginx Web Server (Port 80)"]
            StaticFiles["React SPA Build (HTML/JS/CSS)"]
        end

        subgraph BackContainer ["jurisflow-backend (node:20-alpine)"]
            ExpressServer["Express.js Server (Port 5000)"]
            NonRootUser["USER node (UID 1000)"]
        end

        subgraph MongoContainer ["jurisflow-mongodb (mongo:7.0)"]
            MongoServer["MongoDB Daemon (Port 27017)"]
            AuthStore["SCRAM-SHA-256 Auth (legal_case_management_db)"]
        end
    end

    subgraph Volumes ["Named Persistent Volumes"]
        VolDB[("mongodb_data\n-> /data/db")]
        VolDocs[("document_vault\n-> /usr/src/app/src/uploads")]
    end

    BrowserClient -->|Host Port 3000| NginxServer
    NginxServer --> StaticFiles
    NginxServer -->|http://backend:5000/api/| ExpressServer
    ExpressServer -->|mongodb:27017| MongoServer
    MongoServer --- VolDB
    ExpressServer --- VolDocs
```

---

## 6. Kubernetes Cluster Architecture (Phase 13)

```mermaid
flowchart TD
    subgraph ClusterIngress ["Ingress Controller Layer"]
        IngressRules["jurisflow-ingress (Nginx Ingress)"]
        HostDNS["jurisflow.local / Port-Forward 3000"]
    end

    subgraph K8sNamespace ["Namespace: jurisflow"]
        subgraph FrontServiceTier ["Frontend Tier (Stateless Replicas: 2)"]
            FrontSvc["Service: frontend (ClusterIP: 80)"]
            FrontPod1["Pod: frontend-7d9f-1"]
            FrontPod2["Pod: frontend-7d9f-2"]
        end

        subgraph BackServiceTier ["Backend Tier (Single-Writer: 1)"]
            BackSvc["Service: backend (ClusterIP: 5000)"]
            BackPod["Pod: backend-6c4b-1 (runAsUser: 1000)"]
        end

        subgraph DatabaseTier ["Database Tier (StatefulSet: 1)"]
            MongoSvc["Service: mongodb (ClusterIP: 27017)"]
            MongoPod["Pod: mongodb-0 (mongo:7.0)"]
        end

        subgraph K8sConfigSecrets ["Config & Secrets Layer"]
            ConfigMap["ConfigMap: jurisflow-config"]
            Secret["Secret: jurisflow-secrets (Anti-leak)"]
        end
    end

    subgraph StorageClaims ["Kubernetes Storage (PVC)"]
        VaultPVC[("jurisflow-vault-pvc (2Gi)\nMount: /usr/src/app/src/uploads")]
        MongoPVC[("mongodb-data-mongodb-0 (5Gi)\nMount: /data/db")]
    end

    HostDNS --> IngressRules --> FrontSvc
    FrontSvc --> FrontPod1 & FrontPod2
    FrontPod1 & FrontPod2 -->|http://backend:5000/api/| BackSvc
    BackSvc --> BackPod
    BackPod -->|mongodb.jurisflow.svc.cluster.local:27017| MongoSvc
    MongoSvc --> MongoPod
    BackPod --- VaultPVC
    MongoPod --- MongoPVC
    ConfigMap -.-> BackPod & MongoPod
    Secret -.-> BackPod & MongoPod
```
