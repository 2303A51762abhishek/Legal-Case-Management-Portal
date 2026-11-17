# JurisFlow — Render Cloud Deployment Guide

**Project:** Legal Case and Court Hearing Management Portal (JurisFlow)  
**Student:** MAMILLAPALLY ABHISHEK  
**Roll Number:** 2303A51762  
**Course:** DevOps & Full Stack (B.Tech IV Year I Semester)  
**Platform:** [Render (render.com)](https://render.com) + [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 1. Architecture on Render

```
                                  +------------------------------------+
                                  |         Render Free Tier           |
                                  |                                    |
[ User Browser ]                  |  +------------------------------+  |
       |                          |  |      jurisflow-frontend      |  |
       |--- HTTPS (Port 443) ---->|  |      (Render Static Site)    |  |
       |                          |  |   Vite + React SPA (dist)    |  |
       |                          |  +------------------------------+  |
       |                          |                 |                  |
       |                          |       REST API (Axios /api)        |
       |                          |                 v                  |
       |                          |  +------------------------------+  |
       +--- API Calls (HTTPS) --->|  |      jurisflow-backend       |  |
                                  |  |     (Render Web Service)     |  |
                                  |  |      Node.js + Express       |  |
                                  |  +------------------------------+  |
                                  +-----------------|------------------+
                                                    |
                                         Mongoose TLS (Port 27017)
                                                    v
                                  +------------------------------------+
                                  |       MongoDB Atlas Cloud          |
                                  |        (Free M0 Cluster)           |
                                  |   legal_case_management_db         |
                                  +------------------------------------+
```

* **Frontend:** Hosted as a Render **Static Site** (Free forever, fast global CDN, automated SSL/TLS).
* **Backend:** Hosted as a Render **Web Service** (`Node.js` runtime, health check at `/api/health`).
* **Database:** Hosted on **MongoDB Atlas** (Free M0 Shared Cluster, 512 MB storage).

---

## 2. Prerequisites

1. Your GitHub Repository:
   [https://github.com/2303A51762abhishek/Legal-Case-Management-Portal](https://github.com/2303A51762abhishek/Legal-Case-Management-Portal)
2. Free Account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
3. Free Account on [Render.com](https://dashboard.render.com).

---

## 3. Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

Because Render does not provide a free managed database, MongoDB Atlas M0 is the official standard.

1. **Sign in to MongoDB Atlas** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Database** -> Choose **M0 (Free)**.
3. Select Cloud Provider (AWS) and nearest region (e.g. `ap-south-1` Mumbai or `us-east-1`).
4. **Create Database User:**
   - Go to **Security** -> **Database Access** -> **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `jurisflow_admin`
   - Password: Choose a strong password (e.g. `LegalCaseSecure2026!`).
   - Role: `Read and write to any database`.
5. **Configure Network Access (IP Whitelist):**
   - Go to **Security** -> **Network Access** -> **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) so Render servers can connect.
   - Click **Confirm**.
6. **Obtain Connection String:**
   - Go to **Database** -> Click **Connect** -> Choose **Drivers** (Node.js).
   - Copy the SRV connection string:
     ```text
     mongodb+srv://jurisflow_admin:<password>@cluster0.xxxxx.mongodb.net/legal_case_management_db?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your real user password.

---

## 4. Step 2: Deploy Backend Web Service on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> Select **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Connect your GitHub repository:
   `https://github.com/2303A51762abhishek/Legal-Case-Management-Portal`
5. Configure the Backend Service:

| Field | Configuration Value |
| :--- | :--- |
| **Name** | `jurisflow-backend` |
| **Region** | Oregon (US West) or nearest region |
| **Branch** | `main` |
| **Root Directory** | `backend` *(CRITICAL: Type `backend` here)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

6. Scroll down to **Advanced** -> Add **Health Check Path**:
   - Health Check Path: `/api/health`

7. Click **Environment Variables** -> Add the following key-value pairs:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `HOST` | `0.0.0.0` | Bind to all network interfaces |
| `PORT` | `10000` | Render internal port |
| `MONGODB_URI` | `mongodb+srv://...` | Your full Atlas connection string from Step 1 |
| `JWT_SECRET` | `jurisflow_cloud_jwt_secret_render_2026` | Any secure 32+ character string |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:3000,http://localhost:3001` | Will update with frontend URL in Step 4 |

8. Click **Create Web Service**.
9. Wait 1–2 minutes for the build to finish.
   > **Auto-Seeding Notice:** On the first successful startup, JurisFlow detects that the MongoDB Atlas database is fresh and will automatically run the comprehensive seed script (`seedDemoData`). You do not need to run manual seed commands!
10. Copy your live Backend URL:
    ```text
    https://jurisflow-backend.onrender.com
    ```
    *(Verify in browser: `https://jurisflow-backend.onrender.com/api/health` returns `status: "healthy"`).*

---

## 5. Step 3: Deploy Frontend Static Site on Render

1. Return to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> Select **Static Site**.
3. Select the same GitHub repository:
   `2303A51762abhishek/Legal-Case-Management-Portal`
4. Configure the Static Site:

| Field | Configuration Value |
| :--- | :--- |
| **Name** | `jurisflow-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` *(CRITICAL: Type `frontend` here)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

5. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://jurisflow-backend.onrender.com/api` *(Use your actual backend URL from Step 2)* |

6. Scroll down to **Redirects / Rewrites** *(REQUIRED for Single Page Application routing)*:
   - Click **Add Rule**:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`
   *(This ensures that direct URLs like `/reports`, `/cases`, and `/dashboard` do not return 404 on page refresh).*

7. Click **Create Static Site**.
8. Wait ~1 minute for Vite to build.
9. Copy your live Frontend URL:
   ```text
   https://jurisflow-frontend.onrender.com
   ```

---

## 6. Step 4: Final Linkage & CORS Whitelist

1. In `backend/src/app.js`, wildcard support for all `*.onrender.com` origins is already active in JurisFlow.
2. For explicit security alignment, navigate back to your **`jurisflow-backend`** service in Render:
   - Go to **Environment** tab.
   - Edit `CLIENT_ORIGIN` to include your new frontend URL:
     ```text
     CLIENT_ORIGIN = https://jurisflow-frontend.onrender.com
     ```
   - Click **Save Changes** (Render will automatically redeploy the backend in ~30 seconds).

---

## 7. Alternative: Automated 1-Click Blueprint (`render.yaml`)

JurisFlow includes an Infrastructure-as-Code [render.yaml](../../render.yaml) file in the repository root.

If you prefer 1-click automated provisioning:
1. In Render Dashboard, click **New +** -> **Blueprint**.
2. Select repository `2303A51762abhishek/Legal-Case-Management-Portal`.
3. Render will detect `render.yaml` and configure both `jurisflow-backend` and `jurisflow-frontend` automatically.
4. Input your `MONGODB_URI` when prompted and click **Apply**.

---

## 8. Verified Demo Accounts for Testing

Once deployed, sign in using any of the four pre-seeded accounts:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@jurismanagement.in` | `Admin@123` | Complete platform governance & all metrics |
| **Lawyer** | `abhishek@jurismanagement.in` | `Lawyer@123` | Assigned caseload & hearings calendar |
| **Client** | `vikram.rao@enterprise.com` | `Client@123` | Scoped litigant portal & document downloads |
| **Clerk** | `suresh.clerk@jurismanagement.in` | `Clerk@123` | Registry daily cause list & filings |
