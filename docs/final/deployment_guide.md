# JurisFlow Operational Runbook & Deployment Guide

**Project:** Legal Case and Court Hearing Management Portal (JurisFlow)  
**Student:** MAMILLAPALLY ABHISHEK  
**Roll Number:** 2303A51762  
**Course:** DevOps & Full Stack (B.Tech IV Year I Semester)  
**Academic Year:** 2026–2027  
**Host Environment:** macOS (Apple Silicon / Intel)

---

## 1. Execution Mode Comparison

JurisFlow supports three distinct operational tiers, each serving specific development, evaluation, and production purposes:

| Feature / Dimension | Local Development Mode | Docker Compose Mode (Phase 12) | Kubernetes Cluster Mode (Phase 13) |
| :--- | :--- | :--- | :--- |
| **Primary Purpose** | Rapid developer feedback, hot reloading, debugging | Containerized multi-service runtime, identical staging | Production orchestration, self-healing, horizontal scaling |
| **Frontend Runtime** | Vite dev server (`http://localhost:3000`) | Nginx 1.25 Alpine reverse proxy (`http://localhost:3000`) | Nginx Ingress or Port-Forward (`http://jurisflow.local`) |
| **Backend Runtime** | Node.js host process (`http://127.0.0.1:5000`) | `jurisflow-backend` container (`http://localhost:5001`) | `jurisflow` namespace backend pod (ClusterIP: 5000) |
| **Database Engine** | Local Docker / Memory Server (`localhost:27017`) | `jurisflow-mongodb` container (`127.0.0.1:27017`) | MongoDB StatefulSet (`mongodb-0`, ClusterIP: 27017) |
| **Document Storage** | Local folder (`backend/src/uploads/`) | Named Docker volume (`document_vault`) | PersistentVolumeClaim (`jurisflow-vault-pvc`) |
| **Database Storage** | Host path or transient memory | Named Docker volume (`mongodb_data`) | PersistentVolumeClaim (`mongodb-data-mongodb-0`) |
| **Network Isolation** | Host network loopback | Docker bridge (`jurisflow-network`) | Kubernetes overlay network (`jurisflow` namespace) |
| **Startup Command** | `npm run dev` / `npm start` | `docker compose up --build -d` | `kubectl apply -f kubernetes/` |

---

## 2. Prerequisites & Environment Setup (macOS)

```bash
# 1. Verify Node.js (v20+ recommended) and npm
node --version
npm --version

# 2. Verify Git
git --version

# 3. Verify Docker Desktop is installed and running
docker --version
docker compose version
docker info > /dev/null && echo "Docker daemon is active"

# 4. Verify kubectl
kubectl version --client
```

---

## 3. Operational Mode 1: Local Development (Host Runtime)

### Step 1: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 2: Seed Demonstration Data
```bash
cd ../backend
npm run seed:demo
# Generates 19 Users, 10 Clients, 32 Cases, 42 Hearings, 52 Tasks, 20 Documents, 28 Notifications
```

### Step 3: Start Services
```bash
# Terminal 1: Start Backend REST API Server (port 5000)
cd backend
npm start

# Terminal 2: Start Frontend Vite Dev Server (port 3000)
cd frontend
npm run dev -- --host --port 3000
```

### Step 4: Access Application
- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Backend Health: [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

---

## 4. Operational Mode 2: Multi-Container Docker Compose (Recommended)

### Step 1: Build and Launch Containers
```bash
# From the project root:
docker compose up --build -d
```

### Step 2: Check Container Status & Health
```bash
docker compose ps
```
Expected output:
```
NAME                 IMAGE                                   STATUS                    PORTS
jurisflow-backend    legal-case-management-portal-backend    Up (healthy)              0.0.0.0:5001->5000/tcp
jurisflow-frontend   legal-case-management-portal-frontend   Up (healthy)              0.0.0.0:3000->80/tcp
jurisflow-mongodb    mongo:7.0                               Up (healthy)              127.0.0.1:27017->27017/tcp
```

### Step 3: Stream Live Container Logs
```bash
# Unified logs across all 3 containers
docker compose logs -f

# Logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Step 4: Health Check Probes
```bash
# Frontend Nginx probe
curl http://localhost:3000/healthz

# Backend Health via Nginx reverse proxy
curl http://localhost:3000/api/health

# Direct backend health
curl http://localhost:5001/api/health
```

### Step 5: Safe Container Shutdown (Preserving Data)
```bash
# Stop all containers safely (preserves mongodb_data and document_vault)
docker compose down

# ⚠️ NEVER RUN: docker compose down -v  (this destroys persistent volumes!)
```

---

## 5. Operational Mode 3: Kubernetes Deployment Guide (Phase 13)

### Step 1: Cluster Setup
Ensure a Kubernetes cluster is running (Docker Desktop K8s, Minikube, or Kind).

```bash
# If using Minikube:
minikube start --cpus=4 --memory=6144
minikube image load legal-case-management-portal-backend:latest
minikube image load legal-case-management-portal-frontend:latest

# If using Kind:
kind create cluster --name jurisflow
kind load docker-image legal-case-management-portal-backend:latest --name jurisflow
kind load docker-image legal-case-management-portal-frontend:latest --name jurisflow
```

### Step 2: Deploy Resources
```bash
# 1. Namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. ConfigMap
kubectl apply -f kubernetes/configmap.yaml

# 3. Create Secret imperatively (secure random credentials)
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9')
JWT_SEC=$(openssl rand -hex 32)
kubectl create secret generic jurisflow-secrets \
  --namespace=jurisflow \
  --from-literal=mongo-root-username=admin \
  --from-literal=mongo-root-password="${DB_PASS}" \
  --from-literal=jwt-secret="${JWT_SEC}" \
  --from-literal=mongodb-uri="mongodb://admin:${DB_PASS}@mongodb.jurisflow.svc.cluster.local:27017/legal_case_management_db?authSource=admin"

# 4. MongoDB StatefulSet
kubectl apply -f kubernetes/mongodb/
kubectl rollout status statefulset/mongodb -n jurisflow --timeout=120s

# 5. Backend Deployment
kubectl apply -f kubernetes/backend/
kubectl rollout status deployment/backend -n jurisflow --timeout=120s

# 6. Frontend Deployment
kubectl apply -f kubernetes/frontend/
kubectl rollout status deployment/frontend -n jurisflow --timeout=60s

# 7. Ingress
kubectl apply -f kubernetes/ingress.yaml
```

### Step 3: Access via Port-Forwarding
```bash
kubectl port-forward svc/frontend 3000:80 -n jurisflow
# Access in browser: http://localhost:3000
```

---

## 6. Running the Complete Automated Test Suite

All test suites can be executed from the `backend/` directory:

```bash
cd backend

# 1. Phase 4: Database Connection & Schema Integrity
npm run test:db

# 2. Phase 5: Authentication, bcrypt, & RBAC Boundary Guards
npm run test:auth

# 3. Phase 6: Cases & Clients REST APIs
npm run test:cases

# 4. Phase 7: Court Hearing Scheduling & Conflict Prevention
npm run test:hearings

# 5. Phase 8: Tasks, Deadlines, Document Vault & Notifications
npm run test:phase8

# 6. Phase 9: Four Mandatory Reports & CSV/PDF Export Engine
npm run test:reports

# 7. Phase 10: All Role Dashboards & Live Metric Aggregation
npm run test:phase10

# 8. Phase 11: Data Integrity Audits & Performance Benchmarks
npm run test:phase11

# 9. Phase 11: Puppeteer Browser Automation & Screenshot Capture
npm run test:e2e

# 10. Phase 12: Docker Multi-Container Reverse Proxy & Volume Persistence
npm run test:docker

# 11. Phase 13: Kubernetes Manifest & Schema Specification Audit
npm run test:kubernetes
```

---

## 7. Demonstration Accounts Quick Reference

| Role | Name | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Adv. Rajeshwar Sharma | `admin@jurismanagement.in` | `Admin@123` | System governance, all cases, reports, user CRUD |
| **Lawyer** | Adv. Mamillapally Abhishek | `abhishek@jurismanagement.in` | `Lawyer@123` | Assigned dockets, trial progress, client briefs |
| **Client** | Vikramaditya Rao | `vikram.rao@enterprise.com` | `Client@123` | Litigant portal, own cases, non-confidential docs |
| **Clerk** | Suresh Kumar Verma | `suresh.clerk@jurismanagement.in` | `Clerk@123` | Daily registry roster, cause list, docket filing |
