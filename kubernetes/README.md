# JurisFlow Kubernetes Orchestration Guide (Phase 13)

**Project:** Legal Case & Court Hearing Management Portal (JurisFlow)  
**Student:** MAMILLAPALLY ABHISHEK  
**Roll Number:** 2303A51762  
**Course:** DevOps & Full Stack (B.Tech IV-I, 2026–2027)

---

## 1. Kubernetes Architecture Overview

```mermaid
flowchart TD
    subgraph ClientAccess ["Client Access Layer"]
        Browser["User Web Browser (http://localhost:3000 or http://jurisflow.local)"]
        IngressCtrl["Nginx Ingress Controller (jurisflow-ingress)"]
    end

    subgraph K8sCluster ["Kubernetes Cluster (Namespace: jurisflow)"]
        subgraph FrontendTier ["Frontend Tier (Stateless ReplicaSet: 2 Pods)"]
            FrontSvc["Service: frontend (ClusterIP: 80)"]
            FrontPod1["Pod: frontend-xxxx-1 (Nginx + React SPA)"]
            FrontPod2["Pod: frontend-xxxx-2 (Nginx + React SPA)"]
        end

        subgraph BackendTier ["Backend Tier (Single-Writer: 1 Pod)"]
            BackSvc["Service: backend (ClusterIP: 5000)"]
            BackPod["Pod: backend-xxxx (Node.js 20 LTS + Express)"]
            SecContext["SecurityContext: runAsUser 1000 (Non-Root)"]
        end

        subgraph StorageTier ["Database Tier (StatefulSet)"]
            MongoSvc["Service: mongodb (ClusterIP: 27017)"]
            MongoPod["Pod: mongodb-0 (MongoDB 7.0 Engine)"]
        end

        subgraph ConfigsSecrets ["Configuration & Secrets Management"]
            CfgMap["ConfigMap: jurisflow-config"]
            Sec["Secret: jurisflow-secrets"]
        end
    end

    subgraph PVCLayer ["Persistent Volume Claims (PVC)"]
        PVC_DB[("mongodb-data-mongodb-0 (5Gi)\nMount: /data/db")]
        PVC_Vault[("jurisflow-vault-pvc (2Gi)\nMount: /usr/src/app/src/uploads")]
    end

    Browser -->|Port-Forward 3000:80 or Ingress| FrontSvc
    FrontSvc --> FrontPod1 & FrontPod2
    FrontPod1 & FrontPod2 -->|Internal Proxy: http://backend:5000/api/| BackSvc
    BackSvc --> BackPod
    BackPod -->|Kubernetes DNS: mongodb.jurisflow.svc.cluster.local:27017| MongoSvc
    MongoSvc --> MongoPod
    MongoPod --- PVC_DB
    BackPod --- PVC_Vault
    CfgMap -.-> BackPod & FrontPod1 & MongoPod
    Sec -.-> BackPod & MongoPod
```

---

## 2. Directory Structure

```
kubernetes/
├── namespace.yaml               # Dedicated 'jurisflow' namespace definition
├── configmap.yaml               # Non-sensitive configuration (DB host, port, CORS, limits)
├── secret.example.yaml          # Secret template with placeholders (DO NOT commit real secrets)
├── ingress.yaml                 # Nginx Ingress routing for frontend and API
├── mongodb/
│   ├── pvc.yaml                 # PersistentVolumeClaim for standalone MongoDB deployments
│   ├── service.yaml             # Internal ClusterIP Service (port 27017, no public exposure)
│   └── statefulset.yaml         # StatefulSet with volumeClaimTemplates (5Gi, probes, resources)
├── backend/
│   ├── pvc.yaml                 # PersistentVolumeClaim for Document Vault (2Gi)
│   ├── service.yaml             # Internal ClusterIP Service (port 5000)
│   └── deployment.yaml          # Express API Deployment (non-root node, probes, resource limits)
├── frontend/
│   ├── service.yaml             # ClusterIP Service (port 80)
│   └── deployment.yaml          # React/Nginx Deployment (2 stateless replicas, healthz probes)
└── README.md                    # Operational Runbook & Architecture Guide
```

---

## 3. Prerequisites & Cluster Setup

You can deploy JurisFlow on any standard Kubernetes cluster:
- **Docker Desktop Kubernetes:** Enable Kubernetes under *Docker Desktop Preferences -> Kubernetes -> Enable Kubernetes*.
- **Minikube:** `minikube start --cpus=4 --memory=6144`
- **Kind:** `kind create cluster --name jurisflow`

### Image Preparation for Local Clusters
If your cluster does not pull images from an external registry (like Docker Hub), load the locally built Phase 12 Docker images:

```bash
# Verify local images exist
docker images | grep legal-case-management-portal

# For Docker Desktop Kubernetes:
# Images built via Docker Compose are ALREADY available to Docker Desktop Kubernetes!

# For Minikube:
minikube image load legal-case-management-portal-backend:latest
minikube image load legal-case-management-portal-frontend:latest

# For Kind:
kind load docker-image legal-case-management-portal-backend:latest --name jurisflow
kind load docker-image legal-case-management-portal-frontend:latest --name jurisflow
```

---

## 4. Step-by-Step Deployment Guide

### Step 1: Create Namespace
```bash
kubectl apply -f kubernetes/namespace.yaml
```

### Step 2: Apply ConfigMap
```bash
kubectl apply -f kubernetes/configmap.yaml
```

### Step 3: Create Kubernetes Secrets
> [!IMPORTANT]
> Never commit real credentials or secrets to version control.

Create the secret imperatively in the cluster:
```bash
kubectl create secret generic jurisflow-secrets \
  --namespace=jurisflow \
  --from-literal=mongo-root-username=admin \
  --from-literal=mongo-root-password=LegalCaseSecure2026 \
  --from-literal=jwt-secret=jurisflow_jwt_production_secret_key_2026_devops \
  --from-literal=mongodb-uri="mongodb://admin:LegalCaseSecure2026@mongodb.jurisflow.svc.cluster.local:27017/legal_case_management_db?authSource=admin"
```

*Alternatively, copy `secret.example.yaml` to `secret.yaml` (which is git-ignored), update the values, and run `kubectl apply -f kubernetes/secret.yaml`.*

### Step 4: Deploy MongoDB StatefulSet & Service
```bash
kubectl apply -f kubernetes/mongodb/
```

Wait for the MongoDB pod to become ready:
```bash
kubectl rollout status statefulset/mongodb -n jurisflow --timeout=120s
```

### Step 5: Deploy Backend Deployment & Service
```bash
kubectl apply -f kubernetes/backend/
```

Wait for the backend pod to reach `READY` state:
```bash
kubectl rollout status deployment/backend -n jurisflow --timeout=120s
```

### Step 6: Deploy Frontend Deployment & Service
```bash
kubectl apply -f kubernetes/frontend/
```

Wait for frontend pods to become ready:
```bash
kubectl rollout status deployment/frontend -n jurisflow --timeout=60s
```

### Step 7: (Optional) Apply Ingress Routing
```bash
kubectl apply -f kubernetes/ingress.yaml
```

---

## 5. Application Access Instructions

### Method A: Port-Forwarding (Recommended for Local Testing & Viva Demo)
Forward the frontend service to host port `3000`:
```bash
kubectl port-forward svc/frontend 3000:80 -n jurisflow
```
Access the complete application in your browser:
- **Application URL:** [http://localhost:3000](http://localhost:3000)
- **Frontend Health:** [http://localhost:3000/healthz](http://localhost:3000/healthz)
- **Backend Health (via proxy):** [http://localhost:3000/api/health](http://localhost:3000/api/health)

*(Optional) Direct backend port-forwarding for isolated API diagnostics:*
```bash
kubectl port-forward svc/backend 5001:5000 -n jurisflow
# Test direct: curl http://localhost:5001/api/health
```

### Method B: Nginx Ingress Controller
If an Ingress Controller is installed in your cluster (e.g., `minikube addons enable ingress`):
1. Add `127.0.0.1 jurisflow.local` to `/etc/hosts`.
2. Access [http://jurisflow.local](http://jurisflow.local) in your browser.

---

## 6. Document Vault & Database Persistence

### Shared Storage & Single-Writer Pattern
- **MongoDB Data Persistence:** The `mongodb` StatefulSet utilizes `volumeClaimTemplates` creating `mongodb-data-mongodb-0` (5Gi). All dockets, users, and audit records persist safely across pod restarts.
- **Document Vault Persistence:** The `backend` deployment mounts `jurisflow-vault-pvc` (2Gi) at `/usr/src/app/src/uploads`.
- **Concurrency Architecture:** Standard Kubernetes local clusters provision storage using `ReadWriteOnce` (RWO), which allows attachment to a single node/pod at a time. Therefore, the backend deployment is configured with `replicas: 1` and `strategy: Recreate` to eliminate file-locking collisions. In multi-node enterprise clouds, a `ReadWriteMany` (RWX) storage class (such as AWS EFS or NFS) would be used for multi-replica backend document sharing.

### Verifying Persistence Across Pod Restarts
To demonstrate that files and records survive container termination:
```bash
# 1. Kill backend pod (Kubernetes will immediately spawn a fresh replacement)
kubectl delete pod -l app.kubernetes.io/component=backend -n jurisflow

# 2. Wait for replacement pod to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=backend -n jurisflow --timeout=60s

# 3. Check logs of the new pod
kubectl logs -l app.kubernetes.io/component=backend -n jurisflow --tail=50
```

---

## 7. Scaling Operations

### Stateless Frontend Scaling
The React/Nginx frontend is completely stateless and handles horizontal scaling out-of-the-box:
```bash
# Scale frontend to 4 replicas
kubectl scale deployment frontend --replicas=4 -n jurisflow

# Verify new replicas are running
kubectl get pods -n jurisflow -l app.kubernetes.io/component=frontend
```

### Stateful Backend Guidance
Do **NOT** scale backend replicas above 1 when using `ReadWriteOnce` (RWO) storage, as multiple pods cannot mount the same RWO volume simultaneously.

---

## 8. Inspection & Diagnostic Commands

```bash
# 1. Get all resources in jurisflow namespace
kubectl get all,pvc,configmap,secret -n jurisflow

# 2. Inspect backend pod security context & probes
kubectl describe pod -l app.kubernetes.io/component=backend -n jurisflow

# 3. Stream backend logs
kubectl logs -l app.kubernetes.io/component=backend -n jurisflow -f

# 4. Stream frontend logs
kubectl logs -l app.kubernetes.io/component=frontend -n jurisflow -f

# 5. Check MongoDB StatefulSet health
kubectl describe statefulset mongodb -n jurisflow
```

---

## 9. Cleanup Instructions

### Delete Deployments while Preserving Data:
```bash
kubectl delete deployment frontend backend -n jurisflow
kubectl delete statefulset mongodb -n jurisflow
kubectl delete service frontend backend mongodb -n jurisflow
# PVCs (mongodb-data-mongodb-0 and jurisflow-vault-pvc) remain intact!
```

### Full Teardown (Destructive):
```bash
kubectl delete namespace jurisflow
```
